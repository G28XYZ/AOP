// import { ISliceAction, ISliceProps, TActionPayload, TAppActions } from "../service/store.types";
// export * from "./constants";
// export * from "./types";

export const ESArray = Array;
export const ESString = String;
export const ESDate = Date;

// export function createSlice<State extends object, Reducers extends ISliceAction<State>, Name extends string = string>(
// 	props: ISliceProps<State, Reducers, Name>
// ) {
// 	return {
// 		...props,
// 		actions: {} as TAppActions<Reducers>,
// 		get reducer(): State {
// 			const sliceName = this.name;
// 			const reducers = this.reducers;
// 			for (const f in reducers) {
// 				const func = reducers[f];
// 				const originalFuncName = func.name;
// 				if (originalFuncName !== `${sliceName}/${originalFuncName}`) {
// 					const sliceFuncName = `${sliceName}/${originalFuncName}`;
// 					Object.defineProperty(func, "name", {
// 						value: sliceFuncName,
// 						writable: false,
// 						enumerable: false,
// 					});
// 					Object.assign(this.actions, {
// 						[sliceFuncName]: (payload: State) => {
// 							func(this.initialState, payload);
// 							return { [sliceName]: this.initialState };
// 						},
// 					});
// 					Object.assign(this.actions, {
// 						[originalFuncName]: (payload: Partial<TActionPayload>) => ({ type: sliceFuncName, payload }),
// 					});
// 				}
// 			}
// 			return this.initialState;
// 		},
// 	};
// }

export const IsArray = 'isArray' in ESArray ? ESArray.isArray : (value: any) => toString.call(value) === '[object Array]';

export const IsFunction =
	typeof document !== 'undefined' && typeof document.getElementsByTagName('body') === 'function'
		? (value: any) => !!value && toString.call(value) === '[object Function]'
		: (value: any) => !!value && typeof value === 'function';

export const IsEmpty = (value: any, allowEmptyString?: boolean) => {
	return value == null || (!allowEmptyString ? value === '' : false) || (IsArray(value) && value.length === 0);
};
