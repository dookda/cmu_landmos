import React, { useEffect, useRef } from 'react'
// import * as echarts from 'echarts';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import './Chart.css'

export const Chart = () => {
    var data = [
        ['2023-10-01', 820],
        ['2023-10-02', 932],
        ['2023-10-03', 901],
        ['2023-10-04', 934],
        ['2023-10-05', 1290],
        ['2023-10-06', 1330],
        ['2023-10-07', 1320]
    ].map(item => [new Date(item[0]).getTime(), item[1]]);

    const options = {
        title: {
            text: 'Time Series Line Chart',
        },
        xAxis: {
            type: 'datetime',
        },
        yAxis: {
            title: {
                text: 'Value',
            },
        },
        tooltip: {
            xDateFormat: '%Y-%m-%d',
            shared: true,
        },
        // add height to the chart
        chart: {
            height: 380,
        },
        series: [
            {
                name: 'Sample Data',
                data: [
                    [Date.UTC(2023, 0, 1), 29],
                    [Date.UTC(2023, 0, 2), 71],
                    [Date.UTC(2023, 0, 3), 106],
                    [Date.UTC(2023, 0, 4), 129],
                    [Date.UTC(2023, 0, 5), 144],
                ],
                type: 'line',
            },
        ],
    };

    return (
        <div className="chart-panel">
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    )
}
