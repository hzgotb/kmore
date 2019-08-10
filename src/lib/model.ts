/* eslint-disable import/no-extraneous-dependencies */
import * as Knex from 'knex'
import * as ts from 'typescript'


export type Config = Knex.Config
export interface Options {
  callerFuncNames: CallerFuncName | CallerFuncName[]
  /** Exported vaiable name preifx. Default is "tbs", result will be "tbs_m_n" */
  exportVarPrefix: string
  /** Load js under ts env for debug, Default: false */
  forceLoadTbListJs: boolean
  /**
   * Rewrite loading path during forceLoadTbListJs:true,
   * Default: null
   * @example [ [/src\//u, 'dist/'] ]
   */
  forceLoadTbListJsPathReplaceRules: PathReWriteRule[] | null
  /** Banner at the top of target file. Such as "// eslint-disable"  */
  outputBanner: string
  /** File name suffix of built tables. w/o ext, eg: build-tables */
  outputFileNameSuffix: string
  /** Default is reftb_  */
  refTablesPrefix: string
}
export interface PathReWriteRule extends Array<RegExp | string> {
  0: RegExp
  1: string
  length: 2
}

/**
 * Generate knex method refer to tables.
 * method name from keyof T, ReturnType is the type according to the key,
 * props both enumerable and unenumerable.
 *
 * @description T = { user: {id: number, name: string} }
 *  will get db.user() => Knex.QueryBuilder<{id: number, name: string}>
 */
export interface DbModel<T extends TTableListModel> {
  readonly dbh: Knex
  readonly tables: DbTables<T>
  readonly refTables: DbRefTables<T>
}
export type TTableListModel = object

/**
 * Database Tables Tag Map generated by generics type passing to genTbListFromGenerics<T>()
 */
export type TbListMap = Map<CallerId, DbTables<object>>

/** Define what's genericsTypeId at the callexpression position */
export type CallerIdToLocalTypeIdMap = Map<CallerId, LocalTypeId>


/** Format <caller.path>:typeid-<typeid> */
export type LocalTypeId = string
/** Format <caller.path>:<line>:<column> */
export type CallerId = string
/** Format <caller.path>:<line>:<column>:typeid-<typeid> */
export type CallerTypeId = string
export type CallerTbListMap<T extends TTableListModel> = Map<CallerTypeId, DbTables<T>>


/** GenericsTypeId scope in the file */
export type LocalTypeMap = Map<LocalTypeId, TbListTagMap>
export type CallerTypeMap = Map<CallerTypeId, TbListTagMap>
export type TbListTagMap = Map<TableAlias, ts.JSDocTagInfo[]>

export type GenericsArgName = string

export interface CallerInfo {
  path: string
  line: number
  column: number
}
export interface CallerTypeIdInfo extends CallerInfo {
  typeId: number
}

/**
 * Type of db.tables
 */
export type DbTables<T extends TTableListModel> = T extends void
  ? EmptyTbList
  : T extends never ? EmptyTbList : Record<keyof T, string>
export interface EmptyTbList {
  readonly [key: string]: never
}

/** Type of db.refTables */
export type DbRefTables<T> = {
  /** tbName: () => knex('tb_name') */
  [key in keyof T]: TbQueryBuilder<T[key]>
}
export type TbQueryBuilder<TName> = () => Knex.QueryBuilder<TName>


export type TableAlias = string
export type TableName = string
export type FilePath = string
export type FileName = string

export type ColumnType = boolean | number | string | null | JsonType | Date
export interface BaseTbType {
  [colName: string]: ColumnType | ColumnType[]
}
export interface BaseTbListType {
  [tbAlias: string]: BaseTbType
}

/** Value of key-value pairs object */
export type PlainJsonValueType = boolean | number | string | null | undefined
/**
 * Typeof JSON object parsed from Response data
 * simple key-value pairs object.
 */
export interface JsonType {
  [key: string]: PlainJsonValueType | PlainJsonValueType[] | JsonType | JsonType[]
}


export interface GenTbListFromFileOpts {
  path: string
  typeName: string
  includePathKeyWords?: string | string[]
}
export interface GenTbListFromTypeOpts {
  callerFuncNames: CallerFuncName | CallerFuncName[]
  /** Always excluding "node_module/" */
  includePathKeyWords?: string | string[]
  /** Default: 1 */
  stackDepth?: number
}
export interface RetrieveInfoFromTypeOpts extends GenTbListFromTypeOpts {
  cacheMap: CacheMap
  caller: CallerInfo
}
export type CallerFuncName = string

export interface GenGenericsArgMapOpts extends RetrieveInfoFromTypeOpts {
  checker: ts.TypeChecker
  sourceFile: ts.SourceFile
}

export interface CacheMap {
  readonly tbListMap: TbListMap
  readonly callerIdToLocalTypeIdMap: CallerIdToLocalTypeIdMap
  readonly localTypeMap: LocalTypeMap
}


export interface StackFrame {
  getTypeName(): string
  getFunctionName(): string
  getMethodName(): string
  getFileName(): string
  getLineNumber(): number
  getColumnNumber(): number
  isNative(): boolean
}

export interface WalkNodeOps {
  sourceFile: ts.SourceFile
  matchFuncName: CallerFuncName | CallerFuncName[]
}

export interface WalkNodeWithPositionOps extends WalkNodeOps {
  matchLine: number
  matchColumn: number
}

export interface GenInfoFromNodeOps {
  sourceFile: ts.SourceFile
  checker: ts.TypeChecker
  node: ts.CallExpression
  path: string
  retMap: LocalTypeMap
}

export interface BuildSrcOpts {
  baseDir: string[]
  callerFuncNames?: CallerFuncName | CallerFuncName[]
  /** Default: 5 */
  concurrent?: number
}

export interface MatchedSourceFile {
  checker: ts.TypeChecker
  sourceFile: ts.SourceFile | null
}

