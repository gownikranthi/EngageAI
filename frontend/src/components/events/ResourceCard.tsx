import React from 'react';
import { Resource } from '../../services/events';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { eventService } from '../../services/events';
import { useToast } from '../../hooks/use-toast';

interface ResourceCardProps {
  resources: Resource[];
  eventId: string;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resources, eventId }) => {
  const { toast } = useToast();

  const handleDownload = async (resource: Resource) => {
    try {
      // Log the download
      await eventService.logDownload(eventId, resource.fileName);
      
      // Open file in new tab
      window.open(resource.fileUrl, '_blank');
      
      toast({
        title: "Download started",
        description: `${resource.fileName} is being downloaded.`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (resources.length === 0) {
    return (
      <div className="card-primary p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-subtitle text-foreground">Resources</h3>
        </div>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No resources available</p>
          <p className="text-caption text-muted-foreground">Resources will appear here when added</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-primary p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-subtitle text-foreground">Resources</h3>
          <p className="text-caption text-muted-foreground">
            {resources.length} file{resources.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        {resources.map((resource) => (
          <div 
            key={resource.id} 
            className="p-4 bg-card-subtle rounded-lg border border-border-subtle hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-body font-medium text-foreground truncate">
                  {resource.fileName}
                </h4>
                {resource.description && (
                  <p className="text-caption text-muted-foreground mt-1">
                    {resource.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleDownload(resource)}
                  className="btn-secondary px-3 py-2 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost p-2"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};