package org.icemobile.samples.spring.mediacast;

import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotEmpty;

public class ContestForm {
	
	public static final String DEFAULT_LAYOUT = "m";
	private static final String DEFAULT_PAGE = "upload";
	
	@NotEmpty @Email 
	private String email;
	
	@Size(max = 164)
	private String description;
	
	private String l;//layout
	
	private String p = DEFAULT_PAGE;//page
	
	private String photoId;
	
	private String form;
	
	private String voterId;
	
	String action;
	
	public String getForm() {
		return form;
	}

	public void setForm(String form) {
		this.form = form;
	}

	public String getPhotoId() {
		return photoId;
	}

	public void setPhotoId(String photoId) {
		this.photoId = cleanParam(photoId);
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = cleanParam(email);
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getL() {
		return l;
	}

	public void setL(String layout) {
		if( notNullOrEmpty(layout)){
			this.l = cleanParam(layout);
		}
	}

	@Override
	public String toString() {
		return "ContestForm [email=" + email + ", description=" + description
				+ ", layout=" + l + ", photoId=" + photoId + ", form="
				+ form  + "]";
	}
	
	public boolean isEmpty(){
		return this.email == null || this.email.length() == 0;
	}
	
	private String cleanParam(String param){
		if( param != null && param.indexOf(",") > 0 ){
			param = param.substring(0,param.indexOf(","));
		}
		return param;
	}
	
	private boolean notNullOrEmpty(String param){
		if( param != null && param.length() > 0 ){
			return true;
		}
		return false;
	}

	public String getVoterId() {
		return voterId;
	}

	public void setVoterId(String voterId) {
		if( notNullOrEmpty(voterId)){
			this.voterId = cleanParam(voterId);
		}
	}
	

	public String getP() {
		return p;
	}

	public void setP(String p) {
		if( notNullOrEmpty(p)){
			this.p = cleanParam(p);
		}
	}

	public String getAction() {
		return action;
	}

	public void setAction(String action) {
		if( notNullOrEmpty(action)){
			this.action = cleanParam(action);
		}
	}


}
