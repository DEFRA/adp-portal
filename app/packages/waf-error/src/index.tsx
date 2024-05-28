import '@backstage/cli/asset-types';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

Math.random = () => NaN;

ReactDOM.render(<App />, document.getElementById('root'));
