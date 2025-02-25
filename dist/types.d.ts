export interface BlogSite {
    title: string;
    description: string;
}
export interface BlogBasics {
    name: string;
}
export interface BlogPost {
    title: string;
    content?: string;
    source?: string;
    publishedDate: string;
    slug?: string;
}
export interface BlogPage {
    title: string;
    content?: string;
    source?: string;
    slug?: string;
}
export interface Blog {
    site: BlogSite;
    basics: BlogBasics;
    posts: BlogPost[];
    pages?: BlogPage[];
}
export interface GeneratedFile {
    name: string;
    content: string;
}
