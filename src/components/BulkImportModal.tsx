import { useState, useCallback } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs';
import api from '../lib/api';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    clubId: string;
    clubName: string;
    onSuccess: () => void;
}

interface ParsedMember {
    Name: string;
    Email: string;
    Role: string;
    'Board Type'?: string;
    'Academic Year'?: string;
    'Year Joined'?: string;
}

interface ImportResult {
    total: number;
    added: number;
    updated: number;
    failed: number;
    emailsSent: number;
}

export default function BulkImportModal({ isOpen, onClose, clubId, clubName, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ParsedMember[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        // Parse Excel file for preview
        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new Error('No worksheets found');
            }

            const jsonData: ParsedMember[] = [];
            const headers: string[] = [];

            // Get headers from row 1
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell, colNumber) => {
                headers[colNumber] = cell.text;
            });

            // Iterate rows (starting from 2)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header

                const rowData: any = {};
                let hasData = false;

                headers.forEach((header, colNumber) => {
                    if (header) {
                        const cell = row.getCell(colNumber);
                        // Use .text to get the string representation safely
                        rowData[header] = cell.text;
                        if (rowData[header]) hasData = true;
                    }
                });

                if (hasData) {
                    jsonData.push(rowData as ParsedMember);
                }
            });

            setPreviewData(jsonData.slice(0, 10)); // Show first 10 rows
        } catch (err) {
            console.error('Error parsing excel:', err);
            setError('Failed to parse Excel file. Please check the format.');
            setFile(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv']
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024 // 5MB
    });

    const handleImport = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(`/clubs/${clubId}/members/bulk-import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setResult(response.data.summary);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to import members');
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Members');

        worksheet.columns = [
            { header: 'Name', key: 'Name', width: 20 },
            { header: 'Email', key: 'Email', width: 30 },
            { header: 'Role', key: 'Role', width: 15 },
            { header: 'Board Type', key: 'Board Type', width: 15 },
            { header: 'Academic Year', key: 'Academic Year', width: 15 },
            { header: 'Year Joined', key: 'Year Joined', width: 15 }
        ];

        worksheet.addRows([
            {
                Name: 'John Doe',
                Email: 'john@walchandsangli.ac.in',
                Role: 'member',
                'Board Type': 'main',
                'Academic Year': 'TY',
                'Year Joined': '2025-09-06'
            },
            {
                Name: 'Jane Smith',
                Email: 'jane@walchandsangli.ac.in',
                Role: 'coordinator',
                'Board Type': 'executive',
                'Academic Year': 'SY',
                'Year Joined': '2025-10-16'
            }
        ]);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clubName}_members_template.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const resetModal = () => {
        setFile(null);
        setPreviewData([]);
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Auto Import Members</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Upload an Excel file to add multiple members at once</p>
                    </div>
                    <button
                        onClick={resetModal}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {result ? (
                        // Success Summary
                        <div className="space-y-6">
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Import Complete!</h3>
                                <p className="text-slate-600 dark:text-slate-400">Members have been successfully imported</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.total}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Processed</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.added}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Added</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{result.updated}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Updated</p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{result.emailsSent}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Emails Sent</p>
                                </div>
                            </div>

                            {result.failed > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                    <p className="text-red-600 dark:text-red-400 font-semibold">
                                        {result.failed} member(s) failed to import
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={resetModal}
                                className="w-full py-3 bg-[#002147] hover:bg-[#00152e] text-white rounded-xl font-bold transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Download Template Button */}
                            <div className="mb-6">
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Template
                                </button>
                            </div>

                            {/* File Upload */}
                            {!file ? (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                        {isDragActive ? 'Drop the file here' : 'Drag & drop Excel file here'}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        or click to browse (.xlsx, .xls, .csv)
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                        Maximum file size: 5MB | Maximum 500 members
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* File Info */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {(file.size / 1024).toFixed(2)} KB • {previewData.length} rows
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setPreviewData([]);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Preview Table */}
                                    {previewData.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                                                Preview (first 10 rows)
                                            </h3>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-100 dark:bg-slate-700">
                                                        <tr>
                                                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Name</th>
                                                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Email</th>
                                                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Role</th>
                                                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Board Type</th>
                                                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Academic Year</th>
                                                            <th className="px-2 sm:px-4 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Year Joined</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewData.map((row, idx) => (
                                                            <tr key={idx} className="border-t border-slate-200 dark:border-slate-700">
                                                                <td className="px-2 sm:px-4 py-2 text-slate-900 dark:text-white whitespace-nowrap">{row.Name}</td>
                                                                <td className="px-2 sm:px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs sm:text-sm">{row.Email}</td>
                                                                <td className="px-2 sm:px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.Role}</td>
                                                                <td className="px-2 sm:px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row['Board Type'] || 'N/A'}</td>
                                                                <td className="px-2 sm:px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row['Academic Year'] || 'N/A'}</td>
                                                                <td className="px-2 sm:px-4 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row['Year Joined'] || 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {file && (
                                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                    <button
                                        onClick={resetModal}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-3 bg-[#002147] hover:bg-[#00152e] disabled:bg-slate-400 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-5 h-5" />
                                                Import Members
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
