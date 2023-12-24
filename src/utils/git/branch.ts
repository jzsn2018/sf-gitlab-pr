/**
 * @file 分支
 */

export const getBranches = (branches: any[]) => {
    const data = branches.filter(v => v.type === 1 && !v.name.includes('HEAD')).map(v => {
        v.name = v.name.replace('origin/', '');
        return v;
    });

    return data;
}
