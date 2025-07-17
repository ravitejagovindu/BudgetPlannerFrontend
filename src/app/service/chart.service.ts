import { Injectable } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ApiService } from './api.service';
import { ChartData } from '../model/chartData';
import { Projections } from '../model/projections';

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  constructor(private apiService: ApiService) {}

  Highcharts: typeof Highcharts = Highcharts;

  getIncomePieChart(data: ChartData[]): Highcharts.Options {
    let incomePieChart: Highcharts.Options = this.createPieChart(
      'pie',
      'Income',
      '<b>{point.percentage:.1f}%</b>',
      'Monthly Income',
      data,
      false
    );
    return incomePieChart;
  }

  getSavingsPieChart(data: ChartData[]): Highcharts.Options {
    let savingsPieChart: Highcharts.Options = this.createPieChart(
      'pie',
      'Savings',
      '<b>{point.percentage:.1f}%</b>',
      'Monthly Savings',
      data,
      false
    );
    return savingsPieChart;
  }

  getInvestmentPieChart(data: ChartData[]): Highcharts.Options {
    let investmentPieChart: Highcharts.Options = this.createPieChart(
      'pie',
      'Investments',
      '<b>{point.percentage:.1f}%</b>',
      'Monthly Investments',
      data,
      false
    );
    return investmentPieChart;
  }

  getExpensePieChart(data: ChartData[]): Highcharts.Options {
    let expensePieChart: Highcharts.Options = this.createPieChart(
      'pie',
      'Expenses',
      '<b>{point.percentage:.1f}%</b>',
      'Monthly Expenses',
      data,
      false
    );
    return expensePieChart;
  }

  getExpenseSubCategoriesPieChart(data: ChartData[]): Highcharts.Options {
    let expenseSubCategoriesPieChart: Highcharts.Options = this.createPieChart(
      'pie',
      '',
      '<b>{point.percentage:.1f}%</b>',
      'Monthly Expenses',
      data,
      false
    );
    return expenseSubCategoriesPieChart;
  }

  getOverviewPieChartProjected(data: ChartData[], title: string): Highcharts.Options {
    let overViewPieChartProjected: Highcharts.Options = this.createDonutChart(
      'pie',
      title,
      '<b>{point.percentage:.1f}%</b>',
      'Overview',
      data,
      false,
      '70%'
    );
    return overViewPieChartProjected;
  }

  getOverviewPieChartActual(data: ChartData[], title: string): Highcharts.Options {
    let overViewPieChartActual: Highcharts.Options = this.createDonutChart(
      'pie',
      title,
      '<b>{point.percentage:.1f}%</b>',
      'Overview',
      data,
      false,
      '70%'
    );
    return overViewPieChartActual;
  }

  getOverviewBarChart(data: Projections[]): Highcharts.Options {
    let xAxisNames: string[] = [];
    let seriesData1: number[] = [];
    let seriesData2: number[] = [];

    data.forEach((projection) => {
      xAxisNames.push(projection.type);
      seriesData1.push(projection.projected);
      seriesData2.push(projection.actual);
    });

    let overViewColumnChart: Highcharts.Options = this.createColumnChart(
      'column',
      'Projections VS Actuals',
      '',
      xAxisNames,
      'Projection',
      seriesData1,
      'Actual',
      seriesData2
    );
    return overViewColumnChart;
  }

  createPieChart(
    type: string,
    title: string,
    tooltip: string,
    seriesName: string,
    data: ChartData[],
    labels: boolean
  ): Highcharts.Options {
    let chart: Highcharts.Options = {
      chart: {
        type: type,
      },
      title: {
        text: title,
      },
      tooltip: {
        pointFormat: tooltip,
      },
      series: [
        {
          name: seriesName,
          type: 'pie',
          data: data,
        },
      ],
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          showInLegend: true,
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: labels,
          },
        },
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        useHTML: true,
        maxHeight: 60,
      },
    };
    return chart;
  }

  createDonutChart(
    type: string,
    title: string,
    tooltip: string,
    seriesName: string,
    data: ChartData[],
    labels: boolean,
    innerRadius: string
  ): Highcharts.Options {
    let chart: Highcharts.Options = {
      chart: {
        type: type,
      },
      title: {
        text: title,
        align: 'center',
        verticalAlign: 'middle',
        y: 5
      },
      tooltip: {
        pointFormat: tooltip,
      },
      series: [
        {
          name: seriesName,
          type: 'pie',
          data: data,
        },
      ],
      credits: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          innerSize: innerRadius,
          showInLegend: true,
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: labels,
          },
        },
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        useHTML: true,
        maxHeight: 60,
      },
    };
    return chart;
  }

  createColumnChart(
    type: string,
    chartTitle: string,
    yAxisTitle: string,
    xAxis: string[],
    seriesName1: string,
    seriesData1: any,
    seriesName2: string,
    seriesData2: any
  ) {
    let chart: Highcharts.Options = {
      chart: {
        type: type,
      },
      title: {
        text: chartTitle,
      },
      xAxis: {
        categories: xAxis,
        crosshair: true,
      },
      yAxis: {
        title: {
          text: yAxisTitle,
        },
      },
      tooltip: {
        valuePrefix: '&#8377; ',
      },
      series: [
        {
          name: seriesName1,
          type: 'column',
          data: seriesData1,
        },
        {
          name: seriesName2,
          type: 'column',
          data: seriesData2,
        },
      ],
      credits: {
        enabled: false,
      },
      plotOptions: {
        column: {
          pointPadding: 0.04,
          borderWidth: 0,
        },
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        useHTML: true,
        maxHeight: 60,
      },
    };
    return chart;
  }
}
