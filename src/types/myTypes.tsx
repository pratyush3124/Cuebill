export type TableType = {
    id: number;
    name: string;
    rate: number;
    theme: 'pool' | 'snooker';
    checked_in_at: number;
    time: number;
};

export type BillType = {
    id?: number;
    tableId:number;
    table?: TableType;
    checkIn?: number;
    checkOut?: number;
    timePlayed?: number;
    table_rate?: number;
    tableMoney?: number;
    canteenMoney?: number;
    paymentMode: 'cash' | 'upi' | 'both';
    totalAmount: number;
    note?: string;
};

export type CanteenBillType = {
    id?:number;
    itemId?:number;
    item?: ItemType;
    billId?:number;
    bill?: BillType;
    quantity:number;
    amount:number;
}

export type ItemType = {
    id?: number;
    name: string;
    price: number;
    quantity?: number;
};