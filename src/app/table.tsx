"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Icons } from "~/components/icons";
import { checkInTable, createBill, getItems, getTables } from "~/utils/fetches";
import {
  calculateRevenue,
  formatElapsed,
  formatTime,
  tableTheme,
} from "~/utils/formatters";
import type { BillType, TableType } from "../types/myTypes";
import Food from "./_components/foodModal";
import Note from "./_components/noteModal";
import Bill from "./_components/billModal";
import toast from "react-hot-toast";

export default function Table({ table }: { table: TableType }) {
  const { mutate } = useSWRConfig();

  // menu items fetch
  const { data } = useSWR(`/api/items`, getItems);

  const [elapsedTime, setElapsedTime] = useState<number>();
  // Date.now() - table.checked_in_at
  const [generatedRevenue, setGeneratedRevenue] = useState<string>("0.00");

  const [showFood, setShowFood] = useState<boolean>(false);
  const [showNote, setShowNote] = useState<boolean>(false);
  const [showBill, setShowBill] = useState<boolean>(false);
  const [bill, setBill] = useState<BillType | null>(null);

  const unsettled = table.unsettled.length;

  const imageUrl = tableTheme(table.theme);

  function checkIn() {
    mutate(
      "/api/tables",
      createBill(table.id)
        .then((data: { bill: BillType }) => {
          if (data.bill.id) {
            localStorage.setItem(
              "t" + table.id.toString() + "bill",
              data.bill.id.toString(),
            );
          }
          checkInTable(table.id)
            .then(() => {
              toast.success("Table checked in");
            })
            .catch((error) => {
              toast.error("Table check in failed");
              console.error("Fetch error:", error);
            });
        })
        .catch((error) => {
          toast.error("Table check in failed");
          console.error("Fetch error:", error);
        })
      ,{ optimisticData: (tableData) => {
        // find the table from tableData.tables and update it to checked_in_at = Date.now()
        console.log(tableData);
        const updatedTable = tableData.tables.find((t: TableType) => t.id === table.id);
        if (updatedTable) {
          updatedTable.checked_in_at = Date.now();
        }
        return { tables: tableData.tables };
      }}
    );
  }

  function checkOut() {
    const billId = localStorage.getItem("t" + table.id.toString() + "bill");
    const tempBill: BillType = {
      tableId: table.id,
      checkIn: table.checked_in_at,
      checkOut: Date.now(),
      timePlayed: elapsedTime,
      tableMoney: parseFloat(generatedRevenue),
      paymentMode: "upi",
      upiPaid: parseFloat(generatedRevenue),
      totalAmount: parseFloat(generatedRevenue),
      settled: false,
    };
    if (billId) {
      tempBill.id = parseInt(billId);
    }
    console.log(tempBill);
    setBill(tempBill);
    setShowBill(true);
  }

  useEffect(() => {
    let theTimer: NodeJS.Timeout;

    if (table.checked_in_at) {
      theTimer = setInterval(() => {
        if (table.checked_in_at) {
          setElapsedTime(Date.now() - table.checked_in_at);
          const et = Date.now() - table.checked_in_at;
          setGeneratedRevenue(calculateRevenue(table.rate, et));
        }
      }, 1000);
    }

    return () => {
      clearInterval(theTimer);
      setElapsedTime(0);
      setGeneratedRevenue("0.00");
    };
  }, [table.checked_in_at, table.rate]);

  return (
    <>
      {showBill && (
        <Bill
          bill={bill}
          table={table}
          close={() => {
            // unsettled = {tableId: [bill1, bill2, ...]}
            let unsettled = localStorage.getItem('unsettled');

            // check if unsettled exists else create {} in localstorage
            // check if tableId exists in unsettled else create [] in unsettled
            // push bill to tableId array
            // do this all in typescript

            if (unsettled) {
              console.log(typeof unsettled, unsettled);
              type unsType = {[index:number]:BillType[]}
              let unsjson: unsType = JSON.parse(unsettled);
              console.log(typeof unsjson, unsjson);

              // if (unsjson[table.id]) {
              //   unsjson[table.id].push(bill);
              // } else {
              //   unsjson[table.id] = [bill];
              // }
              localStorage.setItem('unsettled', JSON.stringify(unsjson));
            } else {
              localStorage.setItem('unsettled', JSON.stringify({ [table.id]: [bill] }));
            }

            setShowBill(false);
          }}
          showFood={() => setShowFood(true)}
        />
      )}
      {showFood && (
        <Food
          table={table}
          items={data.items}
          close={() => {
            setShowFood(false);
          }}
        />
      )}
      {showNote && (
        <Note
          tableId={table.id.toString()}
          close={() => {
            setShowNote(false);
          }}
        />
      )}

      <div className="relative m-3 h-[268px] w-[350px]">
        <Image
          src={imageUrl}
          alt="bg"
          fill
          priority={true}
          className="-z-10"
        />

        <button className="absolute top-6 right-7 p-1 px-2 rounded-full bg-orange-600/90">
          {unsettled}
        </button>

        <div className="flex flex-col pt-5">
          <div className="flex justify-between items-center w-full">
            <div className="flex-grow flex justify-center">
              <div className="flex flex-col">
                <span className="mx-auto text-xl font-bold">{table.name}</span>
                <span className="font-">
                  &#8377;{table.rate}/min - &#8377;
                  {Math.round(table.rate * 60)}/hour
                </span>
              </div>
            </div>
          </div>

          {table.checked_in_at ? (
            <div className="flex flex-col justify-evenly">
              <div className="flex justify-center font-medium">
                {formatTime(table.checked_in_at)}
              </div>

              <div className="flex flex-row justify-evenly">
                <div className="flex flex-col">
                  <span className="mx-auto text-sm font-thin">Time</span>
                  <span className="font-medium">
                    {formatElapsed(elapsedTime)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="mx-auto text-sm font-thin">Money</span>
                  <span className="font-medium">&#8377;{generatedRevenue}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-row px-6">
                <button
                  className="my-1 mr-1 flex w-full basis-1/6 items-center justify-center rounded-md bg-green-400/70 shadow-sm hover:bg-green-400/90"
                  onClick={() => {
                    setShowFood(true);
                  }}
                >
                  <Icons.food />
                </button>
                <button
                  className="my-1 mr-1 flex w-full basis-1/6 items-center justify-center rounded-md bg-orange-400/70 shadow-sm hover:bg-orange-400/90"
                  onClick={() => {
                    setShowNote(true);
                  }}
                >
                  <Icons.note />
                </button>
                <button
                  className="my-1 basis-2/3 rounded-md bg-white/30 py-3 shadow-sm hover:bg-white/40"
                  onClick={() => {
                    checkOut();
                  }}
                >
                  <span className="font-semibold">Check Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex">
              <button
                className="mx-auto my-5 rounded-md bg-white/20 px-10 py-6 shadow-sm hover:bg-white/30"
                onClick={() => {
                  checkIn();
                }}
              >
                Check In
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
