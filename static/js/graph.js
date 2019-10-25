queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    var ndx = crossfilter(salaryData);

    salaryData.forEach(function (d) {
        d.salary = parseInt(d.salary);
    });

    show_discipline_selector(ndx);

    show_percent_that_are_professors(ndx, "Female", "#percent-of-women-professors"); // added "Female" target display element
    show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors"); // added "Male" target display element

    show_gender_balance(ndx);
    show_average_salary(ndx);
    show_rank_distribution(ndx);

    dc.renderAll();
}

// discipline selector
function show_discipline_selector(ndx) {
    var dim = ndx.dimension(dc.pluck('discipline'));
    var group = dim.group();

    dc.selectMenu("#discipline-selector")
        .dimension(dim)
        .group(group);
}


// percentage of men and women that are professors

function show_percent_that_are_professors(ndx, gender, element) { //added gender and element
    var percentageThatAreProf = ndx.groupAll().reduce( // instead of percentageFemaleThatAreProf -> good practice for clairty
        // add_item() and remove_item() takes p, and v arguments
        // initialise() function takes no arguments
        function (p, v) {
            if (v.sex === gender) { // instead of "Female"
                p.count ++;
                if (v.rank === "Prof") {
                    p.are_prof ++;
                }
            }
            return p;
        },
        function (p, v) {
            if (v.sex === gender) {
                p.count --;
                if (v.rank === "Prof") {
                    p.are_prof --;
                }
            }
            return p;
        },
        function () {
            return {
                count: 0,
                are_prof: 0
            };
        }
    );
    dc.numberDisplay(element) // instead of "#percent-of-women-professors"
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function (d) {
            if (d.count == 0) {
                return 0;
            } else {
                return (d.are_prof / d.count);
            }
        })
        .group(percentageThatAreProf);

}

// gender balance bar chart
function show_gender_balance(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    var group = dim.group();

    dc.barChart("#gender-balance")
        .width(400)
        .height(300)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 50
        })
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        // .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
}

// custom reduce function for calculating the avarage

function show_average_salary(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));

    function add_item(p, v) {
        p.count++;
        p.total += v.salary;
        p.average = p.total / p.count;
        return p;
    }

    function remove_item(p, v) {
        p.count--;
        if (p.count == 0) {
            p.total = 0;
            p.average = 0;
        } else {
            p.total -= v.salary;
            p.average = p.total / p.count;
        }
        return p;
    }

    function initialise() {
        return {
            count: 0,
            total: 0,
            average: 0
        };
    }

    var averageSalaryByGender = dim.group().reduce(add_item, remove_item, initialise);

    dc.barChart("#average-salary")
        .width(400)
        .height(300)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 50
        })
        .dimension(dim)
        .group(averageSalaryByGender)
        .valueAccessor(function (d) {
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(4);
}

// rank distribution

function show_rank_distribution(ndx) {

    /* Obsolete code after generalizing the function
    var  dim = ndx.dimension(dc.pluck('sex')); was moved under the function
    var profByGender = dim.group().reduce(
         function (p,  v) {
             //add function - will add only in case the match is a professor
             p.total++;
             if(v.rank == rank) { // if(rank == "Prof")
                 p.match++; // how many of the rows in the rank column are male or female
             }
             return p;
         },
         // remove function
         function (p, v) {
             p.total--;
             if(v.rank == rank) {
                 p.match--; // how many of the rows in the rank column are male or female
             }
             return p;
         },
         function () {
             return {total: 0, match: 0};
         }
     ); */

    function rankByGender(dimension, rank) {
        return dimension.group().reduce(
            // add function
            function (p, v) {
                p.total++;
                if (v.rank == rank) {
                    p.match++; // how many of the rows in the rank column are professors
                }
                return p;
            },
            // remove function
            function (p, v) {
                p.total--;
                if (v.rank == rank) {
                    p.match--;
                }
                return p;
            },
            function () {
                return {
                    total: 0,
                    match: 0
                };
            }
        );
    }
    var dim = ndx.dimension(dc.pluck('sex'));
    var profByGender = rankByGender(dim, "Prof");
    var asstProfByGender = rankByGender(dim, "AsstProf");
    var assocProfByGender = rankByGender(dim, "AssocProf");

    dc.barChart("#rank-distribution")
        .width(400)
        .height(300)
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "Asst Prof")
        .stack(assocProfByGender, "Assoc Prof")
        .valueAccessor(function (d) {
            if (d.value.total > 0) {
                return (d.value.match / d.value.total) * 100;
            } else {
                return 0;
            }
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .legend(dc.legend().x(320).y(20).itemHeight(15).gap(5))
        .margins({
            top: 10,
            right: 100,
            bottom: 30,
            left: 30
        });

    // console.log(profByGender.all());

    // percentage of men and women that are professors

}