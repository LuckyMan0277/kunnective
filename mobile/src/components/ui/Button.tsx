import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

export function Button({
    onPress,
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
}: ButtonProps) {
    const baseStyles = 'flex-row items-center justify-center rounded-lg';

    const variants = {
        primary: 'bg-blue-500',
        secondary: 'bg-gray-200',
        outline: 'border border-blue-500 bg-transparent',
        ghost: 'bg-transparent',
    };

    const sizes = {
        sm: 'px-3 py-1.5',
        md: 'px-4 py-3',
        lg: 'px-6 py-4',
    };

    const textColors = {
        primary: 'text-white',
        secondary: 'text-gray-900',
        outline: 'text-blue-500',
        ghost: 'text-blue-500',
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    return (
        <StyledTouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''
                } ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#3b82f6'} />
            ) : (
                <StyledText
                    className={`font-semibold ${textColors[variant]} ${textSizes[size]}`}
                >
                    {title}
                </StyledText>
            )}
        </StyledTouchableOpacity>
    );
}
