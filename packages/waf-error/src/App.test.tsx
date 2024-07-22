import React from 'react';
import { render as testRender } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('Should render correctly', () => {
    // arrange

    // act
    const actual = testRender(<App />);

    // assert
    expect(actual.baseElement).toMatchSnapshot();
  });
});
