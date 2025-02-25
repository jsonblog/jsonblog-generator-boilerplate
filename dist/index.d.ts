import { Blog, GeneratedFile } from './types';
declare const generator: (blog: Blog) => Promise<GeneratedFile[]>;
export = generator;
