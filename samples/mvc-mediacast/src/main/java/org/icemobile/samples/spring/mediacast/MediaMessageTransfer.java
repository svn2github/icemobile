package org.icemobile.samples.spring.mediacast;

import java.io.File;

public class MediaMessageTransfer {
	
	private String id;
	private String description;
	private String fileName;
	private long lastVote;
	private int votes;
	private long created;
	private boolean canVote;
	
	public boolean isCanVote() {
		return canVote;
	}

	public void setCanVote(boolean canVote) {
		this.canVote = canVote;
	}

	public MediaMessageTransfer(MediaMessage msg, boolean canVote){
		id = msg.getId();
		description = msg.getDescription();
		if( msg.getSmallPhoto() != null ){
			fileName = msg.getSmallPhoto().getName();
		}
		if( msg.getVotes() != null ){
			votes = msg.getVotes().size();
		}
		lastVote = msg.getLastVote();
		created = msg.getCreated();
		this.canVote = canVote;
	}

	@Override
	public String toString() {
		return "MediaMessageTransfer [id=" + id + ", description="
				+ description + ", fileName=" + fileName + ", lastVote="
				+ lastVote + ", votes=" + votes + ", created=" + created
				+ ", canVote=" + canVote + "]";
	}

	public long getCreated() {
		return created;
	}

	public String getId() {
		return id;
	}

	public String getDescription() {
		return description;
	}

	public String getFileName() {
		return fileName;
	}

	public long getLastVote() {
		return lastVote;
	}

	public int getVotes() {
		return votes;
	}

}
