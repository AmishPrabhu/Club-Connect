import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Share2, Image, Upload, FileImage, Plus } from 'lucide-react';
import { FirestorePost, User, Attachment } from '../types/auth';
import { getPosts, updatePost } from '../lib/firestoreService';
import AttachmentGallery from '../components/AttachmentGallery';
import CloudinaryUpload from '../components/CloudinaryUpload';
import RSVPModal from '../components/RSVPModal';

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
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);

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
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Date</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{post.date}</p>
                        </div>
                    </div>
                    {post.time && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Time</p>
                                <p className="font-semibold text-slate-900 dark:text-white">{post.time}</p>
                            </div>
                        </div>
                    )}
                    {post.location && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                                {post.locationUrl ? (
                                    <a
                                        href={post.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        {post.location}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                ) : (
                                    <p className="font-semibold text-slate-900 dark:text-white">{post.location}</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Media</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{totalPhotos}</p>
                        </div>
                    </div>
                    {(post.registrationStart || post.registrationEnd) && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Registration Period</p>
                                {post.registrationStart && (
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        <span className="font-medium">Opens:</span> {new Date(post.registrationStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {post.registrationStartTime && ` at ${post.registrationStartTime}`}
                                    </p>
                                )}
                                {post.registrationEnd && (
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                        <span className="font-medium">Closes:</span> {new Date(post.registrationEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {post.registrationEndTime && ` at ${post.registrationEndTime}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RSVP Button for upcoming events */}
                {post.type === 'event' && !isPastEvent && (
                    <div className="mb-6">
                        <button
                            onClick={() => setIsRsvpModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            RSVP for this Event
                        </button>
                    </div>
                )}

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

            {/* RSVP Modal */}
            {post && (
                <RSVPModal
                    isOpen={isRsvpModalOpen}
                    onClose={() => setIsRsvpModalOpen(false)}
                    event={{
                        id: post.id || '',
                        title: post.title,
                        date: post.date,
                        time: post.time || 'Time not specified',
                        location: post.location || 'Location not specified',
                        attendees: post.rsvps || 0
                    }}
                    clubName={post.clubName}
                />
            )}
        </div>
    );
}
