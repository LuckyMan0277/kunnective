import React from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { styled } from 'nativewind';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

const StyledTextInput = styled(TextInput);
const StyledView = styled(View);
const StyledText = styled(Text);

export function Input({
    label,
    error,
    containerClassName = '',
    className = '',
    ...props
}: InputProps) {
    return (
        <StyledView className={`w-full ${containerClassName}`}>
            {label && (
                <StyledText className="mb-1 text-sm font-medium text-gray-700">
                    {label}
                </StyledText>
            )}
            <StyledTextInput
                className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-500 ${error ? 'border-red-500' : ''
                    } ${className}`}
                placeholderTextColor="#9ca3af"
                {...props}
            />
            {error && (
                <StyledText className="mt-1 text-sm text-red-500">{error}</StyledText>
            )}
        </StyledView>
    );
}
