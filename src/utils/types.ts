/** Извлекает вложенные ключи из переданного объекта и родительским ключам */
export type Keys<T, K extends PropertyKey> = T extends object
	? { [P in keyof T]-?: (P extends K ? keyof T[P] : never) | Keys<T[P], K> }[keyof T]
	: never;
/** Вложенные ключи объекта */
export type NestedKeys<T> = Keys<T, keyof T>;
/**  */
export type TDecorator<D = any> = (target: Object, name: string | symbol, descriptor: D) => D;
