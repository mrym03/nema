declare module 'react-native-htmlview' {
  import React from 'react';
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  export interface HTMLViewProps {
    value: string;
    stylesheet?: Record<string, StyleProp<TextStyle | ViewStyle>>;
    onLinkPress?: (url: string) => void;
    onError?: (error: Error) => void;
    renderNode?: (node: any, index: number, siblings: any, parent: any, defaultRenderer: Function) => React.ReactNode;
    RootComponent?: React.ComponentType<any>;
    RootComponentProps?: Record<string, any>;
    NodeComponent?: React.ComponentType<any>;
    NodeComponentProps?: Record<string, any>;
    style?: StyleProp<ViewStyle>;
    bullet?: string;
    paragraphBreak?: string;
    lineBreak?: string;
    addLineBreaks?: boolean;
  }

  export default class HTMLView extends React.Component<HTMLViewProps> {}
} 