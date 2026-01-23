import { NextRequest, NextResponse } from "next/server";
import { list, put, del, copy, head } from "@vercel/blob";

// Helper to get folder path from ID
const getPrefix = (id: string) => {
    // ID is expected to be a path like "/folder/subfolder"
    let prefix = id;
    // Normalize: remove multiple leading slashes
    while (prefix.startsWith("/")) {
        prefix = prefix.substring(1);
    }
    
    if (!prefix) return "";

    if (!prefix.endsWith("/")) prefix = prefix + "/";
    return prefix;
};

// Helper to format blob object to SVAR format
const formatBlob = (blob: any) => {
    const isFolder = blob.pathname.endsWith("/");
    const name = blob.pathname.split("/").filter(Boolean).pop(); 
    // e.g. "folder/file.txt" -> "file.txt"
    // e.g. "folder/" -> "folder"
    
    // We use pathname as ID (e.g. "folder/file.txt")
    // SVAR expects ID to start with / usually for root? Let's keep it consistent with previous FS.
    // FS implementation used "/path/to/file".
    let id = "/" + blob.pathname;
    if (isFolder && id.endsWith("/")) id = id.slice(0, -1); // Remove trailing slash for ID to match SVAR folder IDs?

    return {
        id: id,
        value: name,
        name: name,
        type: isFolder ? "folder" : "file",
        size: blob.size,
        date: blob.uploadedAt ? new Date(blob.uploadedAt).getTime() / 1000 : 0,
        url: blob.url // SVAR might use this for preview/download
    };
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const command = route[0]; 

  // INFO
  if (command === "info") {
      return NextResponse.json({
          stats: {
              total: 10 * 1024 * 1024 * 1024, // Dummy: 10 GB
              free: 5 * 1024 * 1024 * 1024,
              used: 5 * 1024 * 1024 * 1024,
          }
      });
  }

  // FILES (List)
  if (command === "files") {
      const idParts = route.slice(1);
      const id = "/" + idParts.join("/");
      const prefix = getPrefix(id);
      
      try {
          // List blobs with prefix
          const { blobs } = await list({ prefix: prefix, limit: 1000, mode: "expanded" });
          
          // Filter to find direct children
          const directChildren = new Map();
          
          for (const blob of blobs) {
              const relativePath = blob.pathname.slice(prefix.length);
              if (!relativePath) continue; // The folder itself placeholder?
              
              const parts = relativePath.split("/");
              
              if (parts.length === 1) {
                  // It's a file
                  directChildren.set(blob.pathname, { ...blob, type: "file" });
              } else {
                  // It's a folder (or file inside folder)
                  const folderName = parts[0];
                  const folderPath = prefix + folderName + "/";
                  if (!directChildren.has(folderPath)) {
                       directChildren.set(folderPath, {
                           pathname: folderPath,
                           size: 0,
                           uploadedAt: new Date(),
                           type: "folder" // Custom marker
                       });
                  }
              }
          }
          
          const result = Array.from(directChildren.values()).map(b => formatBlob(b));
          return NextResponse.json(result);
          
      } catch (error: any) {
          console.error("GET Error:", error);
          return NextResponse.json({ 
              error: "Failed to list files", 
              details: error.message
          }, { status: 500 });
      }
  }

  return NextResponse.json({ error: "Unknown command" }, { status: 400 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const command = route[0]; 

  // UPLOAD
  if (command === "upload") {
      try {
          const formData = await request.formData();
          const file = formData.get("file") as File;
          const parentId = request.nextUrl.searchParams.get("id") || "/";
          
          if (file) {
            let prefix = getPrefix(parentId);
            const pathname = prefix + file.name;
            
            await put(pathname, file, { access: 'public' });
            return NextResponse.json({ status: "success" });
          }
          return NextResponse.json({ error: "No file provided" }, { status: 400 });
      } catch (error: any) {
          console.error("Upload Error:", error);
          return NextResponse.json({ 
              error: "Failed to upload file", 
              details: error.message 
          }, { status: 500 });
      }
  }

  // CREATE FOLDER
  if (command === "files") {
      try {
          const body = await request.json();
          const idParts = route.slice(1);
          const parentId = "/" + idParts.join("/");
          
          const { name: rawName, type } = body;

          // Validate and sanitize name
          if (!rawName || typeof rawName !== "string") {
              return NextResponse.json({ error: "Invalid name" }, { status: 400 });
          }

          // Check for path traversal, separators, and null bytes
          if (
              rawName.includes("/") || 
              rawName.includes("\\") || 
              rawName.indexOf("\0") !== -1 || 
              rawName === ".." || 
              rawName === "."
          ) {
              return NextResponse.json({ error: "Invalid name: contains restricted characters" }, { status: 400 });
          }

          const name = rawName.trim();
          if (!name) {
              return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
          }

          if (type === "folder") {
              let prefix = getPrefix(parentId);
              const folderPath = prefix + name + "/.keep"; // Create a keep file to reserve folder
              await put(folderPath, "folder", { access: 'public' });
              
              const newId = (parentId === "/" ? "" : parentId) + "/" + name;
              return NextResponse.json({ status: "success", id: newId });
          } else {
              // Create empty file
              let prefix = getPrefix(parentId);
              const filePath = prefix + name;
              await put(filePath, "", { access: 'public' });
              
              const newId = (parentId === "/" ? "" : parentId) + "/" + name;
              return NextResponse.json({ status: "success", id: newId }); 
          }
      } catch (error: any) {
          console.error("Create Error:", error);
          return NextResponse.json({ 
              error: "Failed to create item", 
              details: error.message 
          }, { status: 500 });
      }
  }

return NextResponse.json({ error: "Unknown command" }, { status: 400 });

}


export async function PUT(request: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const command = route[0];
    
    if (command === "files") {
        const body = await request.json();
        const { operation } = body;

        // RENAME
        if (operation === "rename") {
             const idParts = route.slice(1);
             const id = "/" + idParts.join("/"); // Old ID
             const { name: rawName } = body;

             // Validate and sanitize name
             if (!rawName || typeof rawName !== "string") {
                 return NextResponse.json({ error: "Invalid name" }, { status: 400 });
             }

             // Check for path traversal, separators, and null bytes
             if (
                 rawName.includes("/") || 
                 rawName.includes("\\") || 
                 rawName.indexOf("\0") !== -1 || 
                 rawName === ".." || 
                 rawName === "."
             ) {
                 return NextResponse.json({ error: "Invalid name: contains restricted characters" }, { status: 400 });
             }

             const name = rawName.trim();
             if (!name) {
                 return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
             }
             
             // Check if it is a folder or file? 
             // We can invoke `head` to check meta, or just assume from ID?
             // Since blob ids don't strictly show type, we need to be careful.
             // If we rename "foo" to "bar", we need to rename "foo/..." to "bar/..."
             
             const oldPrefix = getPrefix(id);
             // Determine new path
             // id: "/path/to/old" -> parent: "/path/to", name: "old"
             const parentPath = id.substring(0, id.lastIndexOf("/"));
             const newId = parentPath + "/" + name;
             const newPrefix = getPrefix(newId);
             
             // List all files starting with oldPrefix
             const { blobs } = await list({ prefix: oldPrefix, limit: 1000 });
             
             for (const b of blobs) {
                 const newPathName = b.pathname.replace(oldPrefix, newPrefix);
                 await copy(b.url, newPathName, { access: 'public' });
                 await del(b.url);
             }
             
             return NextResponse.json({ status: "success", id: newId });
        }

        // MOVE
        if (operation === "move") {
             const { ids, target } = body; // ids to move, target folder
             const targetPrefix = getPrefix(target);
             const result = [];
             
             for (const itemId of ids) {
                 const oldPrefix = getPrefix(itemId);
                 const folderName = itemId.split("/").pop(); // "folder" or "file.txt"
                 
                 // If it's a file, oldPrefix might be "folder/file.txt/" which is wrong if getPrefix assumes folder
                 // My getPrefix appends /. So if sending file ID, we need to handle carefully.
                 // Let's assume passed ID is always full path.
                 
                 // If list returns matches, it's a folder or file.
                 // We list matches.
                 // Actually, if it is a file "foo.txt", list(prefix="foo.txt/") returns nothing.
                 // So we should try both? Or rely on knowing it's a file?
                 
                 // Strategy: List(prefix=itemId minus leading slash)
                 // But strictly, itemId for file is "/path/file.txt".
                 // getPrefix("/path/file.txt") -> "path/file.txt/"
                 
                 // Let's adjust helper or logic.
                 let cleanId = itemId.startsWith("/") ? itemId.slice(1) : itemId;
                 
                 // Check if it's a "folder" (exists as prefix)
                 let { blobs } = await list({ prefix: cleanId + "/", limit: 1000 });
                 if (blobs.length === 0) {
                     // Maybe it's a single file
                     // Try listing exact match? list({ prefix: cleanId }) might return it + others
                     const fileList = await list({ prefix: cleanId, limit: 1 });
                     if (fileList.blobs.length > 0 && fileList.blobs[0].pathname === cleanId) {
                         blobs = [fileList.blobs[0]];
                     }
                 }
                 
                 for (const b of blobs) {
                     // Rename logic
                     // b.pathname: "oldFolder/sub/file.txt"
                     // cleanId: "oldFolder"
                     // tail: "/sub/file.txt" (including leading slash?)
                     
                     // We want to move "oldFolder" to "target/oldFolder"
                     // So "oldFolder/sub/file.txt" -> "target/oldFolder/sub/file.txt"
                     
                     // If moving file: "oldFile.txt" -> "target/oldFile.txt"
                     
                     const relative = b.pathname.slice(cleanId.length);
                     const newPathName = targetPrefix + folderName + relative;
                     
                     await copy(b.url, newPathName, { access: 'public' });
                     await del(b.url);
                 }
                 result.push({ id: itemId });
             }
             return NextResponse.json({ status: "success", result }); 
        }

        // COPY
        if (operation === "copy") {
             const { ids, target } = body;
             const targetPrefix = getPrefix(target);
             const result = [];

             for (const itemId of ids) {
                 let cleanId = itemId.startsWith("/") ? itemId.slice(1) : itemId;
                 let { blobs } = await list({ prefix: cleanId + "/", limit: 1000 });
                 if (blobs.length === 0) {
                     const fileList = await list({ prefix: cleanId, limit: 1 });
                     if (fileList.blobs.length > 0 && fileList.blobs[0].pathname === cleanId) {
                         blobs = [fileList.blobs[0]];
                     }
                 }
                 
                 const folderName = itemId.split("/").pop(); 

                 for (const b of blobs) {
                     const relative = b.pathname.slice(cleanId.length);
                     const newPathName = targetPrefix + folderName + relative; 
                     // Handle collision? Vercel Blob overwrite by default? Yes.
                     
                     await copy(b.url, newPathName, { access: 'public' });
                 }
                 result.push({ id: itemId });
             }
            return NextResponse.json({ status: "success", result });
        }
    }
    
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
    const body = await request.json();
    const { ids } = body;
    
    if (ids && Array.isArray(ids)) {
        for (const id of ids) {
             let cleanId = id.startsWith("/") ? id.slice(1) : id;
             
             // Try folder first
             let { blobs } = await list({ prefix: cleanId + "/", limit: 1000 });
             if (blobs.length === 0) {
                 // Try file
                 const fileList = await list({ prefix: cleanId, limit: 1 });
                 if (fileList.blobs.length > 0 && fileList.blobs[0].pathname === cleanId) {
                     blobs = [fileList.blobs[0]];
                 }
             }
             
             for (const b of blobs) {
                 await del(b.url);
             }
        }
        return NextResponse.json({ status: "success" });
    }
    
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
}
