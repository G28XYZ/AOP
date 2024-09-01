import { FC, ReactNode, useMemo } from 'react';
import { AOP, Aspect } from '../aop/class';
import { AOPRenderProps, type IJoinPoint } from '../aop/types';
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
