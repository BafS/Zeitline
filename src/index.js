import * as d3 from 'd3';
import moment from 'moment';

let conf = {
  dateRange: [
    moment('2017-01-01'),
    moment('2018-01-01'),
  ],
  timeFormat: '%B',
  ticksIntervals: 'Month', // Day, Week, Month, Year
  intervals: [
    [moment('2017-04-01'), moment('2017-06-01'), 350],
    [moment('2017-08-01'), moment('2017-10-01'), 50],
    // [moment().add(7, 'months'), moment().add(10, 'months'), 100],
  ],
  data: [
    {date: moment().add(10, 'hours'), label: 'test1'},
    {date: moment().add(2, 'days'), label: 'test2'},
    {date: new Date('29 Apr 2017'), label: 'test3a'},
    {date: new Date('29 Apr 2017'), label: 'test3b'},
    {date: new Date('1 May 2017'), label: 'test3c'},
    {date: new Date('10 May 2017'), label: 'test3d'},
    {date: new Date('25 May 2017'), label: 'test4'},
    {date: new Date('25 May 2017'), label: 'test4B'},
    {date: new Date('30 May 2017'), label: 'test4C'},
    {date: new Date('10 Jun 2017'), label: 'test_Jun1'},
    {date: new Date('15 Jun 2017'), label: 'test_Jun2'},
    {date: new Date('10 Aug 2017'), label: 'test5'},
    {date: new Date('Sep 2017'), label: 'test6'},
    {date: new Date('10 Oct 2017'), label: 'test6'},
    {date: new Date('24 Dec 2017'), label: 'test7'},
    {date: new Date('31 Dec 2017'), label: 'test8'},
    {date: new Date('Jan 2018'), label: 'test9'},
    {date: new Date('Feb 2018'), label: 'test9'},
    {date: new Date('10 May 2018'), label: 'test10'},
    {date: new Date('10 May 2018'), label: 'test11'},
    {date: new Date('25 May 2018'), label: 'test13'},
    {date: new Date('Aug 2018'), label: 'test12'},
    {date: new Date('Jan 2019'), label: 'test13'},
    {date: new Date('Jan 2021'), label: 'test14'},
    {date: new Date('Jan 2022'), label: 'test15'},
    {date: new Date('Jan 2030'), label: 'test16'},
  ],
  onClick: function() {
    console.log(this); // eslint-disable-line
    document.querySelector('body').style.background = ['#9b59b6', '#1abc9c', '#f39c12'][Math.floor(Math.random() * 3)];
    setTimeout(() => {
      document.querySelector('body').style.background = '#fff';
    }, 1100);
  },
};

const svg = d3.select('svg');
const margin = {top: 20, right: 20, bottom: 25, left: 30};
const width = +svg.attr('width') - margin.left - margin.right;
const height = +svg.attr('height') - margin.top - margin.bottom;

// Sum intervals size in px
const intervalsSum = conf.intervals.reduce((sum, interval) => sum + interval[2], 0);

// Sum intervals duration
const intervalsDateSum = conf.intervals
  .reduce((duration, interval) => duration.add(interval[1] - interval[0]), moment.duration(0));

const xMain = d3.scaleTime()
  .domain(d3.extent([conf.dateRange[0], conf.dateRange[1] - intervalsDateSum]))
  .range([0, width - intervalsSum]);

const pivots = conf.intervals.reduce((res, interval) => {
  const xInterpolate = xMain(interval[0]);
  return {
    pivots: res.pivots.concat([
      xInterpolate + res.eaten,
      xMain(interval[0]) + interval[2] + res.eaten,
    ]),
    // Intervals previously "eaten" (in px)
    eaten: res.eaten + xInterpolate - xMain(interval[1]) + interval[2],
  };
}, {
  pivots: [],
  eaten: 0,
}).pivots;

const range = [0, ...pivots, width];
const domain = conf.intervals.reduce((all, int) => all.concat([int[0], int[1]]), []);

const x = d3.scaleTime()
  .domain([
    d3.extent(conf.dateRange)[0],
    ...domain,
    d3.extent(conf.dateRange)[1],
  ])
  .range(range); // all pivots

// timeDay, timeWeek, timeMonth, timeYear
const xAxis = d3.axisBottom(x)
  .ticks(d3[`time${conf.ticksIntervals}`])
  .tickPadding(-5)
  .tickSize(18);
  // .tickFormat(d3.time.format('%Y'),)

svg.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

const focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

focus.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);

// Show intervals separations
range.forEach((pivot, index) => {
  focus
    .append('line')
    .attr('class', 'linear reference-line')
      .attr('x1', +pivot)
      .attr('x2', +pivot)
      .attr('y1', height)
      .attr('y2', height - 50);
});

// let t = d3.transition()
//     .duration(500)
//     .ease(d3.easeLinear);

/**
 * Update data
 *
 * @param {object} newConf
 */
function updateData(newConf) {
  // Range
  if (newConf.dateRange) {
    // x.domain(d3.extent(newConf.dateRange));
    // x.domain(newConf.dateRange);
  }

  // Intervals
  if (newConf.ticksIntervals) {
    xAxis.ticks(d3[`time${newConf.ticksIntervals}`]);
  }

  focus.selectAll('circle')
    // .exit()
    .remove();

  focus.selectAll('circle')
    .data(newConf.data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => x(d.date))
    .attr('transform', function(d, i) {
      if (i > 0) {
        let currenty = x(d.date);
        let previousy = x(newConf.data[i-1].date);
        if (currenty - previousy < 15) {
          if (newConf.data[i-1].pos) {
            d.pos = newConf.data[i-1].pos + 1;
          } else {
            d.pos = 1;
          }
          return 'translate(' + 0 + ',' + -15 * d.pos + ')';
        }
      }
    })
    .attr('cy', 120)
    // .on('click', (circle) => {
    //   if (newConf.onClick) {
    //     newConf.onClick.apply(circle);
    //   }
    //   d3.event.stopPropagation();
    // })
    .attr('r', 0)
    .transition()
    // .ease(d3.easeCubicOut)
    // .duration(500)
    .attr('r', 6);

  focus.selectAll('circle')
    .on('click', function(circle) {
      d3.select(this)
        .transition()
        .ease(d3.easeBounceOut)
        .duration(500)
        .attr('r', 15)
        .transition()
        .duration(500)
        .call(() => {
          if (newConf.onClick) {
            newConf.onClick.apply(circle);
          }
          // d3.event.stopPropagation();
        })
        .delay(500)
        .attr('r', 6); // reset size
      // d3.event.stopPropagation();
  });

  if (newConf.timeFormat && newConf.timeFormat !== '') {
    xAxis.tickFormat((d) => d3.timeFormat(newConf.timeFormat)(d));
  } else {
    // Reset default format
    xAxis.tickFormat(null);
  }

  // if (newConf.ticksIntervals || newConf.dateRange) {
  svg.select('.axis--x')
    .transition()
    .duration(500)
    .call(xAxis);
  // }
}

updateData(conf);

document.querySelectorAll('.interval').forEach((e) => {
  e.addEventListener('click', (e) => {
    let typeInt = e.target.getAttribute('data-interval');
    let ticksInterval = e.target.getAttribute('data-ticks-interval');
    let timeFormat = e.target.getAttribute('data-time-format');
    conf.timeFormat = timeFormat;
    conf.ticksIntervals = ticksInterval;

    conf.dateRange = [
      moment(),
      moment().add(1, typeInt),
    ];
    updateData(conf);
  }, false);
});

document.querySelector('.move-left').addEventListener('click', (e) => {
  const diff = conf.dateRange[1] - conf.dateRange[0];

  conf.dateRange[0].subtract(diff);
  conf.dateRange[1].subtract(diff);
  // conf.dateRange[2].subtract(diff);
  updateData(conf);
}, false);

document.querySelector('.move-right').addEventListener('click', (e) => {
  const diff = conf.dateRange[1] - conf.dateRange[0];

  conf.dateRange[0].add(diff);
  conf.dateRange[1].add(diff);
  updateData(conf);
}, false);
