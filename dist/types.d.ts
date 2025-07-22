export interface BlogSite {
    title: string;
    description: string;
}
export interface BlogBasics {
    name: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
        address?: string;
        postalCode?: string;
        city?: string;
        countryCode?: string;
        region?: string;
    };
    profiles?: Array<{
        network: string;
        username: string;
        url?: string;
    }>;
}
export interface BlogPost {
    title: string;
    description?: string;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
    content?: string;
    slug?: string;
    tags?: string[];
    categories?: string[];
}
export interface BlogPage {
    title: string;
    description?: string;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
    content?: string;
    slug?: string;
}
export interface Blog {
    site: BlogSite;
    basics: BlogBasics;
    posts: BlogPost[];
    pages?: BlogPage[];
    meta?: {
        canonical?: string;
        version?: string;
        lastModified?: string;
    };
    settings?: {
        postsPerPage?: number;
    };
}
export interface GeneratedFile {
    name: string;
    content: string;
}
