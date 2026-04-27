/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  RotateCcw, 
  LayoutGrid, 
  UserPlus, 
  Copy, 
  Check, 
  Shuffle, 
  Trash2,
  Share2,
  FileUp,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

type GroupMode = 'byGroups' | 'byMembers';

interface GroupResult {
  id: number;
  members: string[];
  name: string;
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<GroupMode>('byGroups');
  const [targetValue, setTargetValue] = useState(2);
  const [results, setResults] = useState<GroupResult[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameList = useMemo(() => {
    return inputText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name !== '');
  }, [inputText]);

  const handleShuffle = () => {
    if (nameList.length === 0) return;

    const shuffled = [...nameList].sort(() => Math.random() - 0.5);
    const newResults: GroupResult[] = [];

    if (mode === 'byGroups') {
      const groupCount = Math.max(1, targetValue);
      for (let i = 0; i < groupCount; i++) {
        newResults.push({ id: i + 1, name: `第 ${i + 1} 組`, members: [] });
      }
      shuffled.forEach((name, index) => {
        newResults[index % groupCount].members.push(name);
      });
    } else {
      const perGroup = Math.max(1, targetValue);
      const groupCount = Math.ceil(shuffled.length / perGroup);
      for (let i = 0; i < groupCount; i++) {
        const start = i * perGroup;
        const end = start + perGroup;
        newResults.push({
          id: i + 1,
          name: `第 ${i + 1} 組`,
          members: shuffled.slice(start, end)
        });
      }
    }

    setResults(newResults.filter(g => g.members.length > 0));
  };

  const handleCopy = () => {
    if (results.length === 0) return;
    const text = results
      .map(g => `${g.name}:\n${g.members.join('\n')}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportExcel = () => {
    if (results.length === 0) return;
    
    // Prepare data for Excel
    const data: any[] = [];
    results.forEach(group => {
      group.members.forEach(member => {
        data.push({
          '分組名稱': group.name,
          '成員姓名': member
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '分組結果');
    XLSX.writeFile(workbook, `分組結果_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      let names: string[] = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        names = jsonData.flat().map(v => String(v).trim()).filter(v => v && v !== 'undefined');
      } else {
        // Handle txt or csv
        names = (data as string)
          .split(/[\n,]/)
          .map(name => name.trim())
          .filter(name => name !== '');
      }

      if (names.length > 0) {
        setInputText(names.join('\n'));
      }
    };

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearInput = () => {
    setInputText('');
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1D1D1F] font-sans selection:bg-orange-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 relative flex flex-col items-center text-center">
          <div className="absolute right-0 top-0 hidden sm:block">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E7] rounded-xl hover:bg-[#F5F5F7] transition-all text-sm font-medium shadow-sm"
            >
              <FileUp size={16} />
              匯入名單
            </button>
          </div>
          
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
            <Users className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">智能分組助手</h1>
          <p className="text-[#86868B] max-w-md">隨機分組從未如此簡單。輸入名單，即可快速產生公平、隨機的分組方案。</p>
          
          <div className="mt-4 sm:hidden">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5E7] rounded-xl hover:bg-[#F5F5F7] transition-all text-sm font-medium shadow-sm"
            >
              <FileUp size={16} />
              匯入名單
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".txt,.csv,.xlsx,.xls" 
            className="hidden" 
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings Section */}
          <section className="lg:col-span-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium uppercase tracking-wider text-[#86868B]">名單輸入</label>
                <div className="flex gap-2">
                  <span className="text-xs bg-[#F5F5F7] px-2 py-1 rounded-full text-[#86868B]">
                    {nameList.length} 人
                  </span>
                  <button 
                    onClick={clearInput}
                    className="p-1 hover:bg-red-50 rounded-full transition-colors text-red-500"
                    title="清空"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <textarea
                className="w-full h-64 bg-[#F5F5F7] rounded-2xl p-4 resize-none border-none focus:ring-2 focus:ring-orange-200 transition-all outline-none text-base flex-grow"
                placeholder="在此輸入名字，一行一個..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-sm space-y-6">
              <label className="text-sm font-medium uppercase tracking-wider text-[#86868B] block">分組模式</label>
              
              <div className="flex p-1 bg-[#F5F5F7] rounded-xl">
                <button
                  onClick={() => setMode('byGroups')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    mode === 'byGroups' ? 'bg-white shadow-sm text-orange-600' : 'text-[#86868B]'
                  }`}
                >
                  <LayoutGrid size={18} />
                  <span className="font-medium">由組數分</span>
                </button>
                <button
                  onClick={() => setMode('byMembers')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    mode === 'byMembers' ? 'bg-white shadow-sm text-orange-600' : 'text-[#86868B]'
                  }`}
                >
                  <UserPlus size={18} />
                  <span className="font-medium">由人數分</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">
                    {mode === 'byGroups' ? '要分成幾組？' : '每組多少人？'}
                  </span>
                  <div className="flex items-center gap-4 bg-[#F5F5F7] rounded-xl px-2 py-1">
                    <button 
                      onClick={() => setTargetValue(v => Math.max(1, v - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-xl font-bold"
                    >-</button>
                    <input 
                      type="number"
                      className="w-12 text-center bg-transparent border-none focus:ring-0 font-bold text-xl"
                      value={targetValue}
                      onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                    />
                    <button 
                      onClick={() => setTargetValue(v => v + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-xl font-bold"
                    >+</button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleShuffle}
                disabled={nameList.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-[#E5E5E7] disabled:cursor-not-allowed text-white font-bold py-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-100 active:scale(98) text-xl"
              >
                <Shuffle size={24} />
                開始隨機分組
              </button>
            </div>
          </section>

          {/* Results Section */}
          <section className="lg:col-span-12 mt-8">
            <div className="">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 px-2 gap-4">
                <h2 className="text-2xl font-bold">分組結果</h2>
                {results.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 bg-white border border-[#E5E5E7] rounded-xl hover:bg-[#F5F5F7] transition-all flex items-center gap-2 text-sm font-semibold shadow-sm"
                    >
                      {copied ? <Check className="text-green-500" size={18} /> : <Copy size={18} />}
                      {copied ? '已複製' : '按文字複製'}
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="px-4 py-2.5 bg-white border border-[#E5E5E7] rounded-xl hover:bg-[#F5F5F7] transition-all flex items-center gap-2 text-sm font-semibold shadow-sm text-green-600"
                    >
                      <Download size={18} />
                      匯出 Excel
                    </button>
                    <button
                      onClick={handleShuffle}
                      className="px-4 py-2.5 bg-white border border-[#E5E5E7] rounded-xl hover:bg-[#F5F5F7] transition-all flex items-center gap-2 text-sm font-semibold shadow-sm"
                    >
                      <RotateCcw size={18} />
                      重新分組
                    </button>
                  </div>
                )}
              </div>

              {results.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white border border-dashed border-[#E5E5E7] rounded-3xl text-center p-8">
                  <div className="w-20 h-20 bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6">
                    <LayoutGrid className="text-[#C5C5C7] w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-[#86868B]">尚未產生分組</h3>
                  <p className="text-sm text-[#C5C5C7] max-w-xs">在上方輸入名單並選擇模式，點擊開始隨機分組按鈕。</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {results.map((group, idx) => (
                      <motion.div
                        key={group.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className="bg-white border border-[#E5E5E7] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Users size={64} />
                        </div>
                        <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F7] pb-3">
                          <h4 className="font-bold text-orange-600 text-lg uppercase tracking-tight">{group.name}</h4>
                          <span className="text-xs font-bold bg-orange-50 text-orange-500 px-3 py-1 rounded-full">
                            {group.members.length} 人
                          </span>
                        </div>
                        <ul className="space-y-2.5">
                          {group.members.map((member, mIdx) => (
                            <li key={mIdx} className="flex items-center gap-3 text-[#1D1D1F]">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              <span className="font-medium text-base">{member}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-[#E5E5E7] text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-[#86868B] text-sm">
                <span className="flex items-center gap-2">
                    <Share2 size={14} /> 分享給朋友
                </span>
                <span>隱私安全：所有數據皆在您的瀏覽器本地處理，不予上傳。</span>
                <span className="hidden sm:inline">•</span>
                <span>支援格式：TXT, CSV, XLSX</span>
            </div>
        </footer>
      </div>
    </div>
  );
}

