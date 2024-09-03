import { ReactElement } from 'react';
import { AOP } from './class';

export type TFunction<T = any> = (...args: any[]) => T;

export type TClass<T = any> = new (...args: any[]) => T;

export type ConstructorType<T = any> = { new (...args: any[]): T };

export type AdviceDecorator = (target: any, methodName: string) => void;

export interface IAdviceMetadata {
	pointCut: ReturnType<AOP['pointCut']> | null;
	adviceType: ADVICE_TYPE;
	methodName: string;
	id?: string;
}

export interface IJoinPoint {
	originalArgs?: any[];
	currentAround: number;
	proceed: (...args: any[]) => any;
}

export enum ADVICE_TYPE {
	BEFORE = 'BEFORE',
	AFTER = 'AFTER',
	AROUND = 'AROUND',
}

export enum AOP_METADATA {
	ASPECT = 'ASPECT_METADATA',
	ADVICE = 'ADVICE_METADATA',
	ADVICE_IN = 'ADVICE_INTERNAL_METADATA',
}

export interface AOPRenderProps<T extends Record<string, any> = any> {
	render: (props: AOPRenderProps & T) => ReactElement;
}

export type ExtensibleDecorator<T> = (constructor: ConstructorType<T>) => ConstructorType;
