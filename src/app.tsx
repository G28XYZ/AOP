import 'reflect-metadata';
import { useMemo } from 'react';
import { Test, TestPlugin } from './components/test';

function App() {
	const plugin = useMemo(() => new TestPlugin(), []);
	return (
		<>
			<Test plugins={[plugin]} />
			<Test />
		</>
	);
}

export default App;
