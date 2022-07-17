export default class Diamond {
    constructor(p5, startX, startY, hueOrColour, maxSize) {
        this.p = p5;
        this.x = startX;
        this.y = startY;
        this.colour = this.isObject(hueOrColour) ? hueOrColour : this.p.color(hueOrColour, 100, 100);
        this.hue = this.colour._getHue();
        this.size = maxSize / 16;
        this.maxSize = maxSize / 2; 
    }

    isObject(variable) {
        return typeof variable === 'object' &&
            variable !== null &&
            !Array.isArray(variable);
    }    

    update() {
        if(this.size < this.maxSize) {
            this.size++;
        }
    }

    draw() {
        let xDist = this.size / 4 * 3, 
            yDist = this.size, 
            hue = this.hue,
            sat = 100, 
            bright = 100; 
        this.p.stroke(this.hue, 0, 100);
        this.p.fill(hue, sat, bright);
        for (let i = 0; i < 20; i++) {
            this.p.quad(
                this.x, 
                this.y  - yDist, 
                this.x + (xDist / 2), 
                this.y, 
                this.x,
                this.y + yDist, 
                this.x - (xDist / 2), 
                this.y, 
            );
            xDist = xDist - (xDist / 10);
            yDist = yDist - (yDist / 10);
            hue = hue - 15 < 0 ? hue + 345 : hue - 15;
            sat = sat - 10;
            bright = bright - 10;
            this.p.stroke(hue, sat, bright);
            this.p.noFill();
        }
    }
}