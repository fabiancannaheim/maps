let width = 800, height = 500

let svg = d3.select("svg").attr("width", width).attr("height", height);

let projection =  d3.geoAlbers()
    .rotate([0, 0])
    .center([8.3, 46.8])
    .scale(12500)
    .translate([width / 2, height / 2])
    .precision(.1);

let path = d3.geoPath().projection(projection);

let carsMap = {
    t1: {desc: 'Number of new personal cars', unit: 'cars'},
    t2: {desc: 'Share of four-wheel drive vehicles', unit: '%'},
    t3: {desc: 'Average fuel consumption', unit: 'l'},
    t4: {desc: 'Average CO2 emissions', unit: 'kg'},
    t5: {desc: 'Average empty weight', unit: 'kg'},
    t6: {desc: 'Average car prices', unit: 'CHF'},
}

let modeSelect = document.getElementById("mode")
Object.entries(carsMap).forEach(mode => {
    let node = document.createElement("option")
    node.value = mode[0]
    node.innerText = mode[1].desc
    modeSelect.appendChild(node)
})

let timeSlider = document.getElementById("time")

let tooltip = d3.select('#tooltip')

let geo, cars, population, ranges, cantons

const drawMap = (mode, year) => {

    let key = `y${year}${mode}`

    svg.html(null)

    svg.selectAll("path")
        .data(geo)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "canton")
        .attr("data-canton-code", (i) => i.id)
        .attr("fill", (i) => {

            let cantonId
            let cantonCode = i.id
            Object.entries(population).forEach(entry => {
                if (entry[1].code === cantonCode) {
                    cantonId = entry[0]
                }
            })
            let value = cars[cantonId - 1][key]
            let colors =  d3.scaleLinear()
                .domain([ranges[key]['min'], ranges[key]['max']])
                .range(["#11481d", "#c7f8d1"])

            return colors(value)

        });

    cantons = document.querySelectorAll(".canton")
    cantons.forEach(canton => {
        canton.addEventListener('mouseover', function(event) {
            let cantonId, cantonName
            Object.entries(population).forEach(entry => {
                if (entry[1].code === this.getAttribute("data-canton-code")) {
                    cantonId = entry[0]
                    cantonName = entry[1].name
                }
            })
            let value = cars[cantonId - 1][key]
            let line1 = document.createElement("p")
            line1.innerHTML = `${cantonName} ${this.getAttribute("data-canton-code")} - <b>${value} ${carsMap[mode].unit}</b>`
            tooltip.node().appendChild(line1)
            tooltip.style('left', event.clientX + 'px').style('top', event.clientY + 'px')
            tooltip.transition().style('visibility', 'visible')
        })
        canton.addEventListener('mouseout', function() {
            tooltip.html(null)
            tooltip.transition().style('visibility', 'hidden')
        })
    })
}

const getRanges = () => {
    ranges = {}
    cars.forEach((e) => {
        for (const [key, value] of Object.entries(e)) {
            if (key !== "Kanton") {
                if (ranges[key] === undefined) {
                    ranges[key] = {
                        'min': Number.MAX_SAFE_INTEGER,
                        'max': Number.MIN_SAFE_INTEGER
                    }
                }
                let floatValue = parseFloat(value)
                let floatMin = parseFloat(ranges[key]['min'])
                let floatMax = parseFloat(ranges[key]['max'])
                ranges[key]['min'] = floatValue < floatMin ? floatValue : floatMin
                ranges[key]['max'] = floatValue > floatMax ? floatValue : floatMax
            }
        }
    })
}

d3.json("assets/switzerland.json").then((cantonData) => {
    geo = topojson.feature(cantonData, cantonData.objects.cantons).features;
}).then(() => {
    d3.csv("assets/cars.csv").then((carData) => {
        cars = carData
    }).then(() => {
        d3.json("assets/pop_ch.json").then((populationData) => {
            population = populationData
        }).then(() => {
            getRanges()
            drawMap('t1', 2014)
        })
    })
});

modeSelect.addEventListener('change', function() {
    drawMap(this.value, timeSlider.value)
})

timeSlider.addEventListener('change', function() {
    drawMap(modeSelect.value, this.value)
})