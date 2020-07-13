// declare var $: any;

declare const Konva: any
interface String {
    format(strings: String[]): string
}

declare module '*.json' {
    const value: any
    export default value
}
