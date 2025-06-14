import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts';
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

    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            resizeObserver: true
        });
        chartInstanceRef.current = myChart;

        const option = {
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'time' },
            yAxis: { type: 'value' },
            dataZoom: [{ type: 'slider' }, { type: 'inside' }],
            series: [
                {
                    type: 'line',
                    data,
                    showSymbol: false,
                    smooth: true
                }
            ]
        };

        myChart.setOption(option);

        return () => {
            myChart.dispose();
        };
    }, [data]);
    return (
        <div className="panel" ref={chartRef} />
    )
}
