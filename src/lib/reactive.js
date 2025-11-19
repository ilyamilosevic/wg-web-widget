const dependencyTrackerMap = new Map();

let activeEffect = null

export function reactive(target) {
    return new Proxy(target, {
        get(obj, prop) {
            trackDependency(prop);
            return Reflect.get(obj, prop);
        },
        set(obj, prop, value) {
            const result = Reflect.set(obj, prop, value);
            triggerDependency(prop);
            return result;
        }
    });
}

export function effect(fn) {
    activeEffect = fn;
    fn();
    activeEffect = null;
}

function trackDependency(key) {
    if (activeEffect) {
        if (!dependencyTrackerMap.has(key)) {
            dependencyTrackerMap.set(key, new Set());
        }
        dependencyTrackerMap.get(key).add(activeEffect);
    }
}

function triggerDependency(key) {
    const deps = dependencyTrackerMap.get(key);
    if (deps) {
        deps.forEach(effect => effect());
    }
}