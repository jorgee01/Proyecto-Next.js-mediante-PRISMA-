import mysql from 'mysql2/promise';

import type { Pool, PoolConnection, FieldPacket, ResultSetHeader } from 'mysql2/promise';

import { ColumnTypeEnum, Debug, DriverAdapterError } from '@prisma/driver-adapter-utils';

import type {

  ColumnType,

  SqlDriverAdapter,

  SqlDriverAdapterFactory,

  SqlQuery,

  SqlResultSet,

  Transaction,

  TransactionOptions,

  IsolationLevel,

} from '@prisma/driver-adapter-utils';

  

const debug = Debug('prisma:driver-adapter:mysql2');

const adapterName = 'prisma-adapter-mysql2';

  

// mysql2 numeric field type codes

const Type = {

  DECIMAL: 0, TINY: 1, SHORT: 2, LONG: 3, FLOAT: 4, DOUBLE: 5,

  NULL: 6, TIMESTAMP: 7, LONGLONG: 8, INT24: 9, DATE: 10,

  TIME: 11, DATETIME: 12, YEAR: 13, NEWDATE: 14, VARCHAR: 15,

  BIT: 16, TIMESTAMP2: 17, DATETIME2: 18, TIME2: 19,

  JSON: 245, NEWDECIMAL: 246, ENUM: 247, SET: 248,

  TINY_BLOB: 249, MEDIUM_BLOB: 250, LONG_BLOB: 251, BLOB: 252,

  VAR_STRING: 253, STRING: 254, GEOMETRY: 255,

} as const;

  

const UNSIGNED_FLAG = 32;

const BINARY_FLAG = 128;

  

function mapColumnType(field: FieldPacket): ColumnType {

  const type = (field as unknown as { type: number }).type;

  const flags = (field as unknown as { flags: number }).flags;

  switch (type) {

    case Type.TINY: case Type.SHORT: case Type.INT24: case Type.YEAR:

      return ColumnTypeEnum.Int32;

    case Type.LONG:

      return (flags & UNSIGNED_FLAG) ? ColumnTypeEnum.Int64 : ColumnTypeEnum.Int32;

    case Type.LONGLONG:

      return ColumnTypeEnum.Int64;

    case Type.FLOAT:

      return ColumnTypeEnum.Float;

    case Type.DOUBLE:

      return ColumnTypeEnum.Double;

    case Type.TIMESTAMP: case Type.TIMESTAMP2:

    case Type.DATETIME: case Type.DATETIME2:

      return ColumnTypeEnum.DateTime;

    case Type.DATE: case Type.NEWDATE:

      return ColumnTypeEnum.Date;

    case Type.TIME: case Type.TIME2:

      return ColumnTypeEnum.Time;

    case Type.DECIMAL: case Type.NEWDECIMAL:

      return ColumnTypeEnum.Numeric;

    case Type.JSON:

      return ColumnTypeEnum.Json;

    case Type.ENUM:

      return ColumnTypeEnum.Enum;

    case Type.BIT:

      return ColumnTypeEnum.Bytes;

    case Type.VARCHAR: case Type.VAR_STRING: case Type.STRING:

      return (flags & BINARY_FLAG) ? ColumnTypeEnum.Bytes : ColumnTypeEnum.Text;

    case Type.TINY_BLOB: case Type.MEDIUM_BLOB: case Type.LONG_BLOB: case Type.BLOB:

      return (flags & BINARY_FLAG) ? ColumnTypeEnum.Bytes : ColumnTypeEnum.Text;

    case Type.NULL:

      return ColumnTypeEnum.Int32;

    default:

      return ColumnTypeEnum.Text;

  }

}

  

// Convert a row's values. dateStrings:true returns "YYYY-MM-DD HH:MM:SS",

// Prisma expects "YYYY-MM-DDT HH:MM:SS+00:00".

function mapRow(row: unknown[], fields: FieldPacket[]): unknown[] {

  return row.map((value, i) => {

    if (value === null) return null;

    const type = (fields[i] as unknown as { type: number })?.type;

    if (

      typeof value === 'string' &&

      (type === Type.DATETIME || type === Type.DATETIME2 ||

       type === Type.TIMESTAMP || type === Type.TIMESTAMP2)

    ) {

      return value.replace(' ', 'T') + '+00:00';

    }

    if (typeof value === 'bigint') return value.toString();

    return value;

  });

}

  

function formatDateTime(date: Date): string {

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');

  const ms = date.getUTCMilliseconds();

  return (

    pad(date.getUTCFullYear(), 4) + '-' + pad(date.getUTCMonth() + 1) + '-' +

    pad(date.getUTCDate()) + ' ' + pad(date.getUTCHours()) + ':' +

    pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) +

    (ms ? '.' + String(ms).padStart(3, '0') : '')

  );

}

  

function mapArg(arg: unknown, argType: { scalarType: string; dbType?: string }): unknown {

  if (arg === null) return null;

  if (typeof arg === 'string' && argType.scalarType === 'bigint') return BigInt(arg);

  if (typeof arg === 'string' && argType.scalarType === 'datetime') arg = new Date(arg);

  if (arg instanceof Date) return formatDateTime(arg);

  if (typeof arg === 'string' && argType.scalarType === 'bytes') return Buffer.from(arg, 'base64');

  if (ArrayBuffer.isView(arg)) {

    const a = arg as { buffer: ArrayBuffer; byteOffset: number; byteLength: number };

    return Buffer.from(a.buffer, a.byteOffset, a.byteLength);

  }

  return arg;

}

  

// typeCast for mysql2 — string-based field.type inside the typeCast callback

const typeCast = (field: { type: string; buffer: () => Buffer }, next: () => unknown): unknown => {

  if (field.type === 'GEOMETRY') return field.buffer();

  return next();

};

  

function convertError(error: unknown): ConstructorParameters<typeof DriverAdapterError>[0] {

  const e = error as { errno?: number; sqlMessage?: string; message?: string; sqlState?: string; cause?: { message?: string } };

  if (typeof e?.errno === 'number') {

    return {

      kind: 'mysql' as const,

      code: e.errno,

      message: e.sqlMessage ?? e.message ?? 'Unknown error',

      state: e.sqlState ?? 'N/A',

      cause: e.cause?.message,

      originalCode: String(e.errno),

      originalMessage: e.sqlMessage ?? e.message ?? 'Unknown error',

    };

  }

  throw error;

}

  

async function performIO(

  client: Pool | PoolConnection,

  query: SqlQuery,

): Promise<[unknown, FieldPacket[] | undefined]> {

  const { sql, args, argTypes } = query;

  const values = args.map((arg, i) => mapArg(arg, argTypes[i]));

  try {

    return await (client as Pool).execute(

      { sql, rowsAsArray: true, dateStrings: true, typeCast } as Parameters<Pool['execute']>[0],

      values,

    ) as [unknown, FieldPacket[]];

  } catch (e) {

    debug('Error in performIO: %O', e);

    throw new DriverAdapterError(convertError(e));

  }

}

  

class Mysql2Queryable {

  readonly provider = 'mysql' as const;

  readonly adapterName = adapterName;

  

  constructor(protected readonly client: Pool | PoolConnection) {}

  

  async queryRaw(query: SqlQuery): Promise<SqlResultSet> {

    debug('[js::query_raw] %O', query);

    const [result, fields] = await performIO(this.client, query);

  

    // DML result (INSERT / UPDATE / DELETE) — no fields array

    if (!fields || !Array.isArray(result)) {

      const header = result as ResultSetHeader;

      return {

        columnNames: [],

        columnTypes: [],

        rows: [],

        lastInsertId: header.insertId != null ? String(header.insertId) : undefined,

      };

    }

  

    return {

      columnNames: fields.map((f) => f.name),

      columnTypes: fields.map(mapColumnType),

      rows: (result as unknown[][]).map((row) => mapRow(row, fields)),

    };

  }

  

  async executeRaw(query: SqlQuery): Promise<number> {

    debug('[js::execute_raw] %O', query);

    const [result] = await performIO(this.client, query);

    return (result as ResultSetHeader).affectedRows ?? 0;

  }

}

  

class Mysql2Transaction extends Mysql2Queryable implements Transaction {

  readonly options: TransactionOptions = { usePhantomQuery: true };

  

  constructor(private readonly conn: PoolConnection) {

    super(conn);

  }

  

  async commit(): Promise<void> {

    debug('[js::commit]');

    try {

      await this.conn.query('COMMIT');

    } finally {

      this.conn.release();

    }

  }

  

  async rollback(): Promise<void> {

    debug('[js::rollback]');

    try {

      await this.conn.query('ROLLBACK');

    } finally {

      this.conn.release();

    }

  }

  

  async createSavepoint(name: string): Promise<void> {

    await this.conn.query(`SAVEPOINT ${name}`);

  }

  

  async rollbackToSavepoint(name: string): Promise<void> {

    await this.conn.query(`ROLLBACK TO ${name}`);

  }

  

  async releaseSavepoint(name: string): Promise<void> {

    await this.conn.query(`RELEASE SAVEPOINT ${name}`);

  }

}

  

class Mysql2Adapter extends Mysql2Queryable implements SqlDriverAdapter {

  constructor(

    private readonly pool: Pool,

    private readonly schemaName: string | undefined,

  ) {

    super(pool);

  }

  

  getConnectionInfo() {

    return {

      schemaName: this.schemaName,

      supportsRelationJoins: false,

    };

  }

  

  executeScript(_script: string): Promise<void> {

    throw new Error('executeScript not implemented');

  }

  

  async startTransaction(isolationLevel?: IsolationLevel): Promise<Transaction> {

    debug('[js::startTransaction] isolationLevel=%s', isolationLevel);

    const conn = await this.pool.getConnection();

    const tx = new Mysql2Transaction(conn);

    if (isolationLevel) {

      await conn.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

    }

    await conn.query('BEGIN');

    return tx;

  }

  

  async dispose(): Promise<void> {

    await this.pool.end();

  }

}

  

export interface PrismaMysql2Config {

  host?: string;

  port?: number;

  user?: string;

  password?: string;

  database?: string;

  connectionLimit?: number;

  connectTimeout?: number;

  idleTimeout?: number;

  acquireTimeout?: number;

}

  

export class PrismaMysql2 implements SqlDriverAdapterFactory {

  readonly provider = 'mysql' as const;

  readonly adapterName = adapterName;

  

  constructor(private readonly config: PrismaMysql2Config) {}

  

  async connect(): Promise<SqlDriverAdapter> {

    const pool = mysql.createPool({

      ...this.config,

      waitForConnections: true,

    });

    return new Mysql2Adapter(pool, this.config.database);

  }

}