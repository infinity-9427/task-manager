import { DataSource } from 'typeorm';

let activeDataSource: DataSource | null = null;

export const setActiveDataSource = (dataSource: DataSource): void => {
  activeDataSource = dataSource;
};

export const getActiveDataSource = (): DataSource => {
  if (!activeDataSource) {
    throw new Error('Database not initialized. Call setActiveDataSource first.');
  }
  return activeDataSource;
};

export const isDataSourceActive = (): boolean => {
  return activeDataSource !== null && activeDataSource.isInitialized;
};