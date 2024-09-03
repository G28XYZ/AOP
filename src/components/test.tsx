import { FC, ReactNode, useMemo } from 'react';
import { AOP, Aspect } from '../aop/class';
import { AOPRenderProps, ConstructorType, type IJoinPoint } from '../aop/types';
import * as IPSubnetCalculator from 'ip-subnet-calculator';
import { IP_RFC_3330 } from '../utils/rfc';

function ipToNumber(ip: string) {
	let arr: string[] = ip.split('.');
	return +arr[0] * Math.pow(256, 3) + +arr[1] * Math.pow(256, 2) + +arr[2] * 256 + +arr[3];
}

const rfc = new IP_RFC_3330();

console.log(rfc.calculateIp('12.58.82.0', '12.58.82.0'));
// test
export interface TestProps extends AOPRenderProps {
	hello?: string;
	plugins?: Aspect[];
}

const aop = new AOP();

export const defaultRender = ({ hello }: TestProps) => {
	return hello;
};

export class TestPlugin extends Aspect {
	@aop.around(aop.pointCut(defaultRender))
	renderComponent(jp: IJoinPoint, renderProps: TestProps) {
		return <RenderComponent renderProps={renderProps}>{(props: TestProps) => jp.proceed(props)}</RenderComponent>;
	}
}

const RenderComponent: FC<{ children: (data: any) => ReactNode; renderProps: TestProps }> = ({ children, renderProps }) => {
	renderProps.hello += ' with plugin';
	return children(renderProps);
};

const UseAOP = (plugins: Aspect[]): AOPRenderProps => {
	return useMemo(() => aop.createRender(plugins, { render: defaultRender }), plugins);
};

export const Test: FC<Omit<TestProps, 'render'>> = ({ plugins = [], hello = 'hello', ...props }) => {
	const bag = UseAOP(plugins);

	return bag.render({ ...bag, hello, ...props });
};

const Aop = new AOP();

@Aop.extensible()
class SomeClass {
	someMethod() {
		console.log('This is original method');
	}
}

@Aop.aspect
export class PerformanceLoggingAspect {
	@Aop.before(Aop.pointCut(SomeClass, 'someMethod'))
	beforeSomeMethodCall() {
		console.log('Start performance counter for method "someMethod" ...');
		console.time('someMethod');
	}

	@Aop.around(Aop.pointCut(SomeClass, 'someMethod'))
	around(...args) {
		console.log(args);
	}

	@Aop.after(Aop.pointCut(SomeClass, 'someMethod'))
	afterSomeMethodCall() {
		console.timeEnd('someMethod');
	}
}

console.log({ PerformanceLoggingAspect });

new SomeClass().someMethod();
