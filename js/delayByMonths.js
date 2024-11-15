
class delayByMonths {
    constructor(parentElement, displayData, location) {
        this.parentElement = parentElement;
        this.displayData = displayData;

        this.initVis();
    }
    initVis() {
        let vis = this;


        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

    }
}
