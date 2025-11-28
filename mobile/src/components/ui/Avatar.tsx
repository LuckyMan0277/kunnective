import React from 'react';
import { View, Text, Image } from 'react-native';
import { styled } from 'nativewind';

interface AvatarProps {
    src?: string | null;
    fallback: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledImage = styled(Image);

export function Avatar({
    src,
    fallback,
    size = 'md',
    className = '',
}: AvatarProps) {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-14 w-14',
        xl: 'h-20 w-20',
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-lg',
        xl: 'text-2xl',
    };

    if (src) {
        return (
            <StyledImage
                source={{ uri: src }}
                className={`rounded-full bg-gray-200 ${sizes[size]} ${className}`}
            />
        );
    }

    return (
        <StyledView
            className={`items-center justify-center rounded-full bg-blue-500 ${sizes[size]} ${className}`}
        >
            <StyledText className={`font-bold text-white ${textSizes[size]}`}>
                {fallback.charAt(0).toUpperCase()}
            </StyledText>
        </StyledView>
    );
}
