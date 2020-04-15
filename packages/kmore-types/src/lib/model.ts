/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import { JsonType, Spread } from '@waiting/shared-types'
import {
  CallExpression,
  JSDocTagInfo,
  SourceFile,
  TypeChecker,
} from 'typescript'


export interface Options extends GenTbListFromTypeOpts {
  /** Exported table vaiable name prefix. Default is "tbs_", result will be "tbs_m_n" */
  exportVarPrefix: string
  /**
   * Load js under ts env for debug,
   * Default: false
   * Default: true if process.env.NODE_ENV === 'production'
   */
  forceLoadTbListJs: boolean
  /**
   * Rewrite loading path during forceLoadTbListJs:true,
   * Default: null
   * Default: [ [/\/src\//u, '/dist/'] ] if process.env.NODE_ENV === 'production'
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

export interface BuildSrcOpts extends Partial<Options> {
  /** Base dir or file in both relative and absolute style to scan */
  path: string | string[]
  /** Default: 5 */
  concurrent?: number
  /** String key to skip build under path. Default: node_modules */
  excludePathKeys?: string | string[]
  /** Maxium file lines to match CallerFuncName (import), Default: 128 */
  maxScanLines?: number
}

export interface PathReWriteRule extends Array<RegExp | string> {
  0: RegExp
  1: string
  length: 2
}

export type CallerFuncNameSet = Set<CallerFuncName>
/**
 * Name of the function
 * calling genTbListFromType() or kmore() and pass with generics type
 */
export type CallerFuncName = string

export type TTables = object

/**
 * Database Tables Tag Map generated by generics type passing to genTbListFromGenerics<T>()
 */
export type TbListMap = Map<CallerId, Tables<object>>
export type TbColListMap = Map<CallerId, MultiTableCols<object>>

/** Define what's genericsTypeId at the callexpression position */
export type CallerIdToLocalTypeIdMap = Map<CallerId, LocalTypeId>


/** Format <caller.path>:typeid-<inputGenericsTypeName> */
export type LocalTypeId = string
/** Format <caller.path>:<line>:<column> */
export type CallerId = string
/** Format <caller.path>:<line>:<column>:typeid-<inputGenericsTypeName> */
export type CallerTypeId = string
export type CallerTbListMap<T extends TTables> = Map<CallerTypeId, TablesMapArr<T>>

export interface TablesMapArr<T extends TTables>
  extends Array<Tables<T> | MultiTableCols<T>> {
  0: Tables<T>
  1: MultiTableCols<T>
  length: 2
}
export interface TablesMapArrCommon<T extends TTables>
  extends Array<Tables<T> | MultiTableColsCommon<T>> {
  0: Tables<T>
  1: MultiTableColsCommon<T>
  length: 2
}
export type MultiTableColsCommon<T extends TTables> =
  MultiTableCols<T> | MultiTableScopedCols<T> | MultiTableAliasCols<T>

/** GenericsTypeId scope in the file */
export type LocalTypeMap = Map<LocalTypeId, TagsMapArr>
export type CallerTypeMap = Map<CallerTypeId, TagsMapArr>
export type TbListTagMap = Map<TableAlias, JSDocTagInfo[]>

export type TbColListTagMap = Map<TableAlias, ColListTagMap>
export type TbScopedColListTagMap = Map<TableAlias, ColListTagMap>
export type TbJointColListTagMap = Map<TableAlias, ColListTagMap>
export type ColListTagMap = Map<TableColAlias, JSDocTagInfo[]>

export interface TbTagsMap {
  tbTagMap: TbListTagMap
  tbColTagMap: TbColListTagMap
  // tbScopedColTagMap: TbScopedColListTagMap
}

export interface LocalTypeItem {
  localTypeId: string
  tagsMapArr?: TagsMapArr
}

export interface TagsMapArr extends Array<TbListTagMap | TbColListTagMap> {
  0: TbListTagMap
  1: TbColListTagMap
  length: 2
}

export type GenericsArgName = string

export interface CallerInfo {
  path: string
  line: number
  column: number
}
export interface CallerTypeIdInfo extends CallerInfo {
  /** GenericsTypeName as param */
  typeId: string
}

/**
 * K(more)Tables array contains:
 *  tables: tables name
 *  columns: columns name of the tables
 */
export interface KTablesBase<T extends TTables> {
  /**
   * Tables alias/name pairs
   * { tb_alias: "tb_name" }
   */
  tables: Tables<T>
  /**
   * Columns mapping object, tb_name w/o table prefix
   * ```json
   * {
   *    tb_alias: { col_alias: "col_name", ..., }
   * }
   * ```
   */
  columns: MultiTableCols<T>
}

/**
 * Type of db.tables
 */
export type Tables<T extends TTables> = T extends void
  ? EmptyTbList
  : T extends never ? EmptyTbList : Record<keyof T, string>
export interface EmptyTbList {
  readonly [key: string]: never
}

/**
 * Type of db.tableCols.tb_foo.col_bar
 */
export type MultiTableCols<T extends TTables> = T extends void
  ? EmptyTbList
  : T extends never ? EmptyTbList : Columns<T>
export enum ColumnExtPropKeys {
  tableAlias = '_tableAlias',
  tablesRef = '_tablesRef',
  sColsCacheMap = '_scopedColsCacheMap',
  genFieldsAliasFn = 'genFieldsAlias',
}
export type Columns<T extends TTables> = BaseMultiTableColumns<T> & {
  readonly [ColumnExtPropKeys.tableAlias]: TableAlias,
  readonly [ColumnExtPropKeys.tablesRef]: KTablesBase<T>['tables'],
  readonly [ColumnExtPropKeys.sColsCacheMap]: Map<TableAlias, ScopedColumns<T>>,
}

/**
 * Type of db.tableCols.tb_foo.col_bar,
 * value with table prefix, eg. `tb_foo.col_name`
 */
export type MultiTableScopedCols<T extends TTables> = T extends void
  ? EmptyTbList
  : T extends never ? EmptyTbList : ScopedColumns<T>
/**
 * {
 *  tbAlias1:
 *   {
 *      colAlias1: tbName.colName,
 *      ...
 *   },
 *  ...
 * }
 */
export type ScopedColumns<T extends TTables> = BaseMultiTableColumns<T>
export type BaseMultiTableColumns<T extends TTables> = {
  readonly [tbAlias in keyof T]: TableFields<T, tbAlias>
}
export type TableFields<T, TbAlias extends keyof T = any> = {
  readonly [colAlias in keyof T[TbAlias]]: string
}
// export type ScopedColumns<T extends TTables> = {
//   readonly [tbAlias in keyof T]: {
//     readonly [colAlias in keyof T[tbAlias]]: string
//   }
// }


export type TableAlias = string
export type TableColAlias = string
export type TableName = string
export type FilePath = string
export type FileName = string

// no use
export interface BaseTbListType {
  [tbAlias: string]: BaseTbType
}
export interface BaseTbType {
  [colName: string]: ColumnType | ColumnType[]
}
export type ColumnType = boolean | number | string | null | JsonType | Date | bigint


export interface GenTbListFromTypeOpts {
  /**
   * Distance from genTbListFromType() or kmore(),
   * Default: 0 means calling genTbListFromType() or kmore()  directly
   */
  callerDistance: number
}
// export interface RetrieveInfoFromTypeOpts extends GenTbListFromTypeOpts {}
export interface RetrieveInfoFromTypeOpts {
  cacheMap: CacheMap
  caller: CallerInfo
}


export interface CacheMap {
  readonly tbListMap: TbListMap
  readonly tbColListMap: TbColListMap
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
  sourceFile: SourceFile
  matchFuncNameSet: CallerFuncNameSet
}

export interface WalkNodeWithPositionOps extends WalkNodeOps {
  matchLine: number
  matchColumn: number
}

export interface GenInfoFromNodeOps {
  sourceFile: SourceFile
  checker: TypeChecker
  node: CallExpression
  path: string
  // localTypeMapKeys: string[] // Object.keys(LocalTypeMap)
}

export interface MatchedSourceFile {
  checker: TypeChecker
  sourceFile: SourceFile | null
}

export interface LoadVarFromFileOpts {
  path: string
  caller: CallerInfo
  options: Options
}

export type JointTable<L, R, KeyExcludeOptional = void> = Spread<L, R, KeyExcludeOptional>


export type MultiTableAliasCols<T extends TTables> = {
  [tbAlias in keyof T]: TableAliasCols<T[tbAlias]>
}
export type TableAliasCols<TAliasCols = any> = AliasTableCols<TAliasCols> & {
  [ColumnExtPropKeys.genFieldsAliasFn]<T extends AliasTableCols<TAliasCols> = any>(
    keyArr: ((keyof T) | '*')[],
    /** Default: false */
    useColAliasNameAsOutputName?: boolean,
  ): KnexColumnsParma,
}
export type AliasTableCols<TAliasCols = any> = {
  [col in keyof TAliasCols]: ColAliasType<TAliasCols[col]>
}
/**
 * {
 *   // jointTableColumns.output: jointTableColumns.inupt
 *   tbUserDetailUid: 'tb_user_detail.uid',
 *   tbUserDetailAge: 'tb_user_detail.age',
 * }
 */
export interface KnexColumnsParma {
  [out: string]: string
}
export interface ColAliasType<TColType> {
  /** input column name */
  input: string
  /** output column alias name */
  output: string
  _typePlaceholder: TColType
}
export type JointRetTable<K extends TableAliasCols> = {
  [col in keyof K]: K[col]['_typePlaceholder']
}

