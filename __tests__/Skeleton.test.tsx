import React from 'react';
import { render } from '@testing-library/react-native';
import Skeleton from '../components/ui/Skeleton';

describe('Skeleton Component', () => {
  it('renders correctly with given dimensions', () => {
    const { getByTestId } = render(
      <Skeleton 
        width={100} 
        height={20} 
        borderRadius={5} 
        testID="skeleton-view" 
      />
    );
    
    // In React Native testing library, we can check styles to confirm props were passed
    const skeleton = getByTestId('skeleton-view');
    expect(skeleton.props.style).toContainEqual(expect.objectContaining({
      width: 100,
      height: 20,
      borderRadius: 5,
    }));
  });
});
