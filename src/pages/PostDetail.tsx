import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Users, Share2, Image, Upload, FileImage } from 'lucide-react';
import { FirestorePost, User, Attachment } from '../types/auth';
import { getPosts, updatePost } from '../lib/firestoreService';
import AttachmentGallery from '../components/AttachmentGallery';
import CloudinaryUpload from '../components/CloudinaryUpload';

interface PostDetailProps {
    postId: string;
    onBack: () => void;
    user?: User | null;
}

export default function PostDetail({ postId, onBack, user }: PostDetailProps) {
    const [post, setPost] = useState<FirestorePost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isShared, setIsShared] = useState(false);
    const [isEditingPhotos, setIsEditingPhotos] = useState(false);
    const [editAttachments, setEditAttachments] = useState<Attachment[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const posts = await getPosts();
                const foundPost = posts.find(p => p.id === postId);
                setPost(foundPost || null);
            } catch (error) {
                console.error('Error fetching post:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    // Check if current user can edit this post (is the club secretary for this club)
    const canEditPhotos = user && post && (
        (user.role === 'club-secretary' && user.clubId === post.clubId) ||
        user.role === 'admin'
    );

    // Check if event is past
    const isPastEvent = post && post.type === 'event' && new Date(post.date) < new Date();

    const handleShare = async () => {
        if (!post) return;

        const shareData = {
            title: post.title,
            text: `Check out: ${post.title} by ${post.clubName}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                setIsShared(true);
                setTimeout(() => setIsShared(false), 2000);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(`${shareData.title} - ${shareData.url}`);
            setIsShared(true);
            setTimeout(() => setIsShared(false), 2000);
        }
    };

    const handleStartEditPhotos = () => {
        setEditAttachments(post?.eventPhotos || []);
        setIsEditingPhotos(true);
    };

    const handleSavePhotos = async () => {
        if (!post?.id) return;

        setIsSaving(true);
        const success = await updatePost(post.id, { eventPhotos: editAttachments });
        if (success) {
            setPost({ ...post, eventPhotos: editAttachments });
            setIsEditingPhotos(false);
        }
        setIsSaving(false);
    };

    const getTypeColor = (type: string) => {
        return type === 'event'
            ? 'from-blue-500 to-cyan-500'
            : 'from-purple-500 to-pink-500';
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
                <p className="text-center text-xl text-slate-600 dark:text-slate-400">Post not found</p>
            </div>
        );
    }

    const totalPhotos = (post.attachments?.length || 0) + (post.eventPhotos?.length || 0);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${getTypeColor(post.type)} text-white`}>
                                {post.type === 'event' ? 'Event' : 'Announcement'}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                by {post.clubName}
                            </span>
                            {isPastEvent && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                                    Completed
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {post.title}
                        </h1>
                    </div>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        {isShared ? 'Shared!' : 'Share'}
                    </button>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{post.date}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">RSVPs</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{post.rsvps || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Media</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{totalPhotos}</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Description</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {/* Description Images (uploaded when creating post) */}
                    {post.attachments && post.attachments.length > 0 && (
                        <div className="mt-4">
                            <AttachmentGallery attachments={post.attachments} />
                        </div>
                    )}
                </div>

                {/* Event Photos Section (only for events) */}
                {post.type === 'event' && (
                    <div className="mb-8 pt-6 border-t border-slate-200 dark:border-slate-700">

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileImage className="w-5 h-5" />
                                Event Photos & Videos ({post.eventPhotos?.length || 0})
                            </h3>

                            {/* Secretary Upload Button for Past Events */}
                            {canEditPhotos && isPastEvent && !isEditingPhotos && (
                                <button
                                    onClick={handleStartEditPhotos}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    Add Event Photos
                                </button>
                            )}
                        </div>

                        {/* Edit Photos Mode */}
                        {isEditingPhotos ? (
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Upload photos and videos from this event to share with the community.
                                </p>
                                <CloudinaryUpload
                                    clubName={post.clubName}
                                    existingAttachments={editAttachments}
                                    onUploadComplete={(attachments) => setEditAttachments(attachments)}
                                    maxFiles={50}
                                />
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setIsEditingPhotos(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePhotos}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-all"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Photos'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {post.eventPhotos && post.eventPhotos.length > 0 ? (
                                    <AttachmentGallery attachments={post.eventPhotos} />
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <FileImage className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">No event photos yet</p>
                                        {canEditPhotos && isPastEvent && (
                                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                                Click "Add Event Photos" to upload photos from this event
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Posted Info */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                    Posted by {post.authorName} on {new Date(post.createdAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
