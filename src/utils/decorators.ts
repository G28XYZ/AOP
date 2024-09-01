import { TDecorator } from ".";

export const Loading = (): TDecorator => {
	return (_, __, descriptor) => {
		const original = descriptor.value;
		if (typeof original === "function") {
			descriptor.value = async function (...args: unknown[]) {
				try {
					this.dispatch && this.actions && this.dispatch(this.actions.setLoading({ isLoading: true }));
					return await original.apply(this, args);
				} catch (e) {
					e;
				} finally {
					this.dispatch && this.actions && this.dispatch(this.actions.setLoading({ isLoading: false }));
				}
			};
		}
		return descriptor;
	};
};

export const MiddlewareLoading = (): TDecorator => {
	return (_, __, descriptor) => {
		const original = descriptor.value;
		if (typeof original === "function") {
			descriptor.value = async function (...args: unknown[]) {
				const { dispatch, actions } = this.model;
				try {
					dispatch && actions && dispatch(actions.setLoading({ isLoading: true }));
					return dispatch(await original.apply(this, args));
				} catch (e) {
					e;
				} finally {
					dispatch && actions && dispatch(actions.setLoading({ isLoading: false }));
				}
			};
		}
		return descriptor;
	};
};
