declare module 'react-native-square-grid' {
    import React, {Component} from "react";
    export interface SquareGridProps {
        columns: number;
        rows: number;
        items: any[];
        renderItems: (item, index) => React.ReactNode;
    }
    export default class SquareGrid extends Component<SquareGridProps, any> {};
}

