'use client';
import { useEffect, useState } from "react";
import { Filemanager } from "@svar-ui/react-filemanager";
import { RestDataProvider } from "@svar-ui/filemanager-data-provider";
import type { IEntity } from "@svar-ui/react-filemanager";
import "@svar-ui/react-filemanager/all.css";
import { WillowDark } from "@svar-ui/react-filemanager";

export default function App() {
  const [data, setData] = useState<IEntity[]>([]);
  const url = "/api/fs";
  // Ensure we only create the provider once
  const [restProvider] = useState(() => new RestDataProvider(url));

  const init = (api: any) => {
    // Connect the provider to the Filemanager event bus
    api.setNext(restProvider);

    api.on("download-file", (ev: any) => {
      const file = api.getFile(ev.id);
      if (file && file.url) {
          window.open(file.url, "_blank");
      }
    });

    api.on("open-file", (ev: any) => {
      const file = api.getFile(ev.id);
      if (file && file.url) {
          window.open(file.url, "_blank");
      }
    });
  };

  useEffect(() => {
    // Initial load
    restProvider.loadFiles("/").then((files: IEntity[]) => {
        setData(files);
    });
  }, [restProvider]);

  return (
    <div className="w-full h-screen overflow-hidden">
      <style jsx global>{`
        .wx-theme {
          height: 100%;
        }
      `}</style>
      <div className="h-full">
        <WillowDark fonts={true}>
          <Filemanager data={data} init={init} />
        </WillowDark>
      </div>
    </div>
  );
}