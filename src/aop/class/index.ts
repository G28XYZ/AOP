import lodash from 'lodash';
import { ADVICE_TYPE, AdviceDecorator, AOP_METADATA, ConstructorType, IAdviceMetadata, IJoinPoint, TClass, TFunction } from '../types';

const getAspectAdvices = (target: any): Advice[] => Reflect.getMetadata(AOP_METADATA.ADVICE, target) || [];

const getAspects = (target: any): Set<ConstructorType> => Reflect.getMetadata(AOP_METADATA.ASPECT, target);

const getInternalAdvices = (target: TClass | object['constructor']): IAdviceMetadata[] =>
	Reflect.getMetadata(AOP_METADATA.ADVICE_IN, target) || [];

class Advice {
	constructor(public pointCut: PointCut, readonly adviceType: ADVICE_TYPE, readonly adviceAction: TFunction) {}
}

class JoinPoint implements IJoinPoint {
	originalArgs?: any[] = null;
	currentAround: number = null;

	constructor(private aroundList: Advice[], private targetFn: TFunction, private context?: any) {
		this.aroundList = aroundList;
		this.targetFn = !this.context ? targetFn : targetFn.bind(this.context);
		this.currentAround = 0;
	}

	proceed(...args: any[]) {
		if (!this.originalArgs) {
			this.originalArgs = [...args];
		}

		if (this.currentAround === this.aroundList.length) {
			return this.targetFn(...args);
		}

		this.currentAround++;

		return this.aroundList[this.currentAround - 1].adviceAction(this, ...args);
	}
}

class PointCut {
	constructor(readonly target: TFunction | TClass, readonly methodName?: string) {}

	isMatch(target: Record<string, any>) {
		if (lodash.isEmpty(this.methodName)) {
			return target === this.target;
		}
		return (
			target instanceof this.target &&
			this.methodName !== undefined &&
			this.methodName !== null &&
			lodash.isFunction(target[this.methodName])
		);
	}

	getMatchedMethods(target: Record<string, any>) {
		return this.isMatch(target) && !lodash.isEmpty(this.methodName) ? [this.methodName] : [];
	}
}

export class Aspect {
	constructor() {
		const advicesMetadata: IAdviceMetadata[] = getInternalAdvices(this.constructor) || [];
		console.log(advicesMetadata);

		const advices = advicesMetadata
			.filter(({ pointCut }) => !!pointCut)
			.map(
				({ pointCut, adviceType, methodName }) =>
					new Advice(pointCut, adviceType, (Reflect.get(this, methodName) as any)?.bind(this))
			);

		Reflect.defineMetadata(AOP_METADATA.ADVICE, advices, this);

		advicesMetadata.forEach(({ pointCut }) => pointCut && AOP.registerAspect(pointCut.target, this.constructor as any));
	}
}

export class AOP {
	private adviceList: Record<ADVICE_TYPE, Advice[]> = {
		[ADVICE_TYPE.AROUND]: [],
		[ADVICE_TYPE.BEFORE]: [],
		[ADVICE_TYPE.AFTER]: [],
	};

	main<T extends TFunction>(advices: Advice[], targetFn: T): T;
	main(advices: Advice[], instance: Record<string, any>): TFunction;
	main(advices: Advice[], target: any) {
		return lodash.isFunction(target) ? this.extendFunction(advices, target) : this.extendClassInstance(advices, target);
	}

	static registerAspect = (target: TFunction | TClass | undefined, aspect: TClass) => {
		if (target) {
			!Reflect.hasMetadata(AOP_METADATA.ASPECT, target) && Reflect.defineMetadata(AOP_METADATA.ASPECT, new Set(), target);
			const aspectsMetadata: Set<ConstructorType> = getAspects(target);
			aspectsMetadata.add(aspect);
			console.log({ aspectsMetadata });
		}
	};

	createAspect = (constructor: TClass) => {
		const advicesMetadata: IAdviceMetadata[] = getInternalAdvices(constructor) || [];
		console.log(advicesMetadata);

		const decoratedAspect: ConstructorType = class extends constructor {
			constructor(...args: unknown[]) {
				super(...args);
				console.log(constructor);
				const advices = advicesMetadata
					.filter(({ pointCut }) => !!pointCut)
					.map(({ pointCut, adviceType, methodName }) => new Advice(pointCut, adviceType, this[methodName].bind(this)));
				Reflect.defineMetadata(AOP_METADATA.ADVICE, advices, this);
			}
		};

		advicesMetadata.forEach(({ pointCut }) => pointCut && AOP.registerAspect(pointCut.target, decoratedAspect));

		return decoratedAspect;
	};

	extendFunction(advices: Advice[], targetFn: TFunction, context?: any) {
		Object.keys(ADVICE_TYPE).forEach((advice) => {
			switch (advice) {
				case ADVICE_TYPE.AROUND:
				case ADVICE_TYPE.BEFORE:
				case ADVICE_TYPE.AFTER:
					this.adviceList[advice] = advices.filter(
						({ pointCut, adviceType }) => adviceType === advice && pointCut?.isMatch(context || targetFn)
					);
			}
		});

		const { AROUND, BEFORE, AFTER } = this.adviceList;

		return (...args: any[]) => {
			const jp = new JoinPoint(AROUND, targetFn, context);

			for (let i = 0; i < BEFORE.length; i++) BEFORE[i].adviceAction(...args);

			const res = jp.proceed(...args);

			for (let i = 0; i < AFTER.length; i++) AFTER[i].adviceAction(...args);

			return res;
		};
	}

	extendClassInstance(advices: Advice[], instance: any) {
		const extensibleMethods = new Set<string>();

		advices.forEach(({ pointCut }) => {
			pointCut
				?.getMatchedMethods(instance)
				.forEach((methodName) => methodName !== undefined && methodName !== null && extensibleMethods.add(methodName));
		});

		extensibleMethods.forEach((methodName) => {
			instance[methodName] = this.extendFunction(advices, instance[methodName], instance);
		});

		return instance;
	}

	createRender = (aspects: any[], originalFunctions: Record<'render', TFunction>) => {
		const allAdvices = aspects.reduce((previousValue, aspect) => [...previousValue, ...getAspectAdvices(aspect)], []);

		return { render: this.main(allAdvices, originalFunctions.render) };
	};

	createAdviceDecorator = (adviceType: ADVICE_TYPE, pointCut: PointCut | string): AdviceDecorator => {
		return (target: TFunction | TClass, methodName: string) => {
			console.log(2);
			const pointCutInstance = pointCut instanceof PointCut ? pointCut : null;

			!Reflect.hasMetadata(AOP_METADATA.ADVICE_IN, target.constructor) &&
				Reflect.defineMetadata(AOP_METADATA.ADVICE_IN, [], target.constructor);

			const advicesMetadata: IAdviceMetadata[] = getInternalAdvices(target.constructor);
			advicesMetadata.push({ pointCut: pointCutInstance, adviceType, methodName });
		};
	};

	around = (pointCut: PointCut) => this.createAdviceDecorator(ADVICE_TYPE.AROUND, pointCut);
	before = (pointCut: PointCut) => this.createAdviceDecorator(ADVICE_TYPE.BEFORE, pointCut);
	after = (pointCut: PointCut) => this.createAdviceDecorator(ADVICE_TYPE.AFTER, pointCut);

	aspect = (constructor: TClass) => this.createAspect(constructor);

	pointCut = (target: TFunction | TClass, methodName?: string) => new PointCut(target, methodName);
}
