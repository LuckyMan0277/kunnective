import React from 'react';
import { View, ViewProps } from 'react-native';
import { styled } from 'nativewind';

interface CardProps extends ViewProps {
    className?: string;
}

const StyledView = styled(View);

export function Card({ children, className = '', ...props }: CardProps) {
    return (
        <StyledView
            className={`rounded-xl bg-white p-4 shadow-sm ${className}`}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
            }}
            {...props}
        >
            {children}
        </StyledView>
    );
}
