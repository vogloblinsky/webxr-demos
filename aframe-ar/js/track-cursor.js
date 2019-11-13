AFRAME.registerComponent('track-cursor-intersection', {
    init: function () {
        this.point = new THREE.Vector3();
    },

    tick: function (t, dt) {
        // NOTE: not throttled to raycaster checkIntersections interval!
        var cursor = this.el.components.cursor;
        var raycaster = this.el.components.raycaster;
        var newIntersection;
        // NOTE: A-Frame 0.7.1 (which doesn't need this) does not have raycaster.intersections
        if (cursor && raycaster && raycaster.intersections) {
            newIntersection = raycaster.intersections.length ? raycaster.intersections[0] : undefined;
            // NOTE: the intersections are always different (!) so check object
            if ((cursor.intersection && cursor.intersection.object) !== (newIntersection && newIntersection.object)) {
                // new cursor intersection object
                cursor.intersection = newIntersection;
                this.el.emit('cursor-intersection-changed', cursor.intersection, false);
            } else
                if (newIntersection && !newIntersection.point.equals(cursor.intersection.point)) {
                    // new cursor intersection point
                    cursor.intersection.point.copy(newIntersection.point);
                    this.el.emit('cursor-intersection-changed', newIntersection, false);
                } else {
                    // same or no cursor intersection point
                }
        }
    }
});