export function findByClassName(parent, className) {
    for (let child of parent) {
	    if (child && child.ClassName === className) return child;
    }
}