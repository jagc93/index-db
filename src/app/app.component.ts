import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IndexDBService } from './service/index-db/index-db.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterContentInit, OnDestroy {
  title = 'index DB';
  data: any[] = [];
  dataDB: any[] = [];
  key: IDBValidKey | null = null;

  constructor(private indexDBService: IndexDBService) { }

  private async initData(): Promise<void> {
    for (let i = 0; i < 100; i++) {
      this.data.push({
        id: i + 1,
        name: `name ${i + 1}`
      });
    }
  }

  public ngOnInit(): void {
    this.initData();
  }

  public async ngAfterContentInit(): Promise<void> {
    try {
      // await this.indexDBService.deleteDB();
      await this.indexDBService.openDB();
      const allData = await this.indexDBService.getAllData() || [];
      if (allData.length === 0) {
        const key = await this.indexDBService.addData(this.data);
        this.key = key;
        const data = await this.indexDBService.getData(key);
        this.dataDB = data;
      } else {
        this.dataDB = allData[0].value;
        this.key = allData[0].key;
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.indexDBService.closeDB();
    }
  }

  public ngOnDestroy(): void {
    if (this.key) {
      this.indexDBService.deleteData(this.key);
    }
    // this.indexDBService.deleteDB();
  }
}
