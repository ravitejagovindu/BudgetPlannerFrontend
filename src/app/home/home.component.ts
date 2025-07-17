import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {

  ngOnInit(): void {

  }

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
    },
    title: {
      text: 'Browser Market Share with "Other" Breakdown',
    },
    series: [
      {
        type: 'pie',
        name: 'Main Browsers',
        data: [
          { name: 'Chrome', y: 70 },
          { name: 'Firefox', y: 15 },
          { name: 'Edge', y: 10 },
          {
            name: 'Other',
            y: 5,
            dataLabels: {
              enabled: false, // Hide data label for 'Other' in the main pie
            },
          },
        ],
      },
      {
        type: 'pie',
        name: 'Other Browsers',
        size: '60%', // Adjust size of the secondary pie
        innerSize: '40%', // Create a donut shape for the secondary pie
        dataLabels: {
          format: '<b>{point.name}</b>: {point.percentage:.1f}%',
        },
        data: [
          { name: 'Safari', y: 2 },
          { name: 'Opera', y: 1.5 },
          { name: 'IE', y: 1 },
          { name: 'Brave', y: 0.5 },
        ],
      },
    ],
  };
}
