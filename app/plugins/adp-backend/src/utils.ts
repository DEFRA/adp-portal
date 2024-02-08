export function createName (name: string) {
    const nameValue = name.replace(/\s+/g, '-').toLowerCase().substring(0,64);
    return nameValue;
}

export function createTitle(title:string, short_name?: string) {
    const titleValue =  short_name ? (title + " " + `(${short_name})`) : title
    return titleValue;
}