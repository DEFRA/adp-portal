import Bookshelf from 'bookshelf';
import { ProgrammeManager } from './programmeManager';

export class DeliveryProgramme extends Bookshelf.Model<DeliveryProgramme> {
  
  get tableName() { return 'delivery_programme'; }
  
  public get DeliveryProgrammeId(): string {
    return this.get('id');
  }
  public set DeliveryProgrammeId(value: string) {
    this.set({ id: value });
  }
  public get CreatedAt(): Date {
    return this.get('created_at');
  }
  public set CreatedAt(value: Date) {
    this.set({ created_at: value });
  }
  public get UpdatedAt(): Date {
    return this.get('updated_at');
  }
  public set UpdatedAt(value: Date) {
    this.set({ updated_at: value });
  }
  public get Name(): string {
    return this.get('name');
  }
  public set Name(value: string) {
    this.set({ name: value });
  }
  public get Title(): string {
    return this.get('title');
  }
  public set Title(value: string) {
    this.set({ title: value });
  }
  public get Alias(): string {
    return this.get('alias');
  }
  public set Alias(value: string) {
    this.set({ alias: value });
  }
  public get Description(): string {
    return this.get('description');
  }
  public set Description(value: string) {
    this.set({ description: value });
  }
  public get FinanceCode(): string {
    return this.get('finance_code');
  }
  public set FinanceCode(value: string) {
    this.set({ finance_code: value });
  }
  public get ArmsLengthBody(): string {
    return this.get('arms_length_body');
  }
  public set ArmsLengthBody(value: string) {
    this.set({ arms_length_body: value });
  }
  public get DeliveryProgrammeCode(): string {
    return this.get('delivery_programme_code');
  }
  public set DeliveryProgrammeCode(value: string) {
    this.set({ delivery_programme_code: value });
  }
  public get Url(): string {
    return this.get('url');
  }
  public set Url(value: string) {
    this.set({ url: value });
  }
 
  managers(): Bookshelf.Collection<ProgrammeManager> {
    return this.belongsToMany(ProgrammeManager, 'delivery_programme_pm');
  }
}
